<?php
header("Access-Control-Allow-Origin: *");
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.re
 * fd
 */

session_start();

if(!isset($_SESSION['url'])){
    $url = "localhost";
    define('UN','root');
    define('PW','');
}
else{
    $url = $_SESSION['url'];
    define('UN',$_SESSION['username']);
    define('PW',$_SESSION['password']);
}

$post = count($_POST);
$get = count($_GET);

$mysql = new PDO("mysql:host=".$url.";",UN,PW);
//echo $get;
$params = json_decode(file_get_contents('php://input'),true);
//print_r(count($params));

if($post>0){
    $method = $_POST['method'];
    $method();
}
if($get>0){
    $method = $_GET['method'];
    $method();
}
if(count($params)>0){
    $method = $params['method'];
    $method();
//    switch ($method){
//        case 'queryData':
//            queryData();
//            break;
//    }
}



function setConnection(){
    global $params;
    try{
        //if(!isset($_SESSION['url'])){
            $mysql = new PDO("mysql:host=".$params["url"],$params["username"],$params["password"]);

            $_SESSION['url'] = $params["url"];
            $_SESSION['username'] = $params["username"];
            $_SESSION['password'] = $params["password"];
        //}
        echo 1;
    } catch (Exception $ex) {
        print_r($ex);
    }
}

/**
 * Function to run query
 * 
 */

function queryData(){
    global $params;
    $db = $params['db'];
    global $url;
    $array = array();
    try{
        $mysql = new PDO("mysql:host=".$url.";dbname=".$db,UN,PW);
        $mysql->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $query = $params['query'];
        $prep = $mysql->prepare($query);
        $prep->execute();
        
        while($data = $prep->fetch(PDO::FETCH_ASSOC)){
            $array[] = $data;
        }
        $result = array(
            "data" => $array,
            "total" => 0
        );
    } catch (PDOException $e) {
        $result = array(
            "error" => $e->getMessage()
        );
    }
    
    echo json_encode($result);
}


function updateTableData(){
    global $mysql;
    global $params;
    $db = $params['dbname'];
    $tbl = $params['tblname'];
    $content = $params['content'];
    $type = $params['type'];
    
    
    if($type == 'add'){
        $col = array();
        $val = array();
        foreach($content as $key=>$value){
            if($key != "add" && $key != "edit" && $key != "removed" && $key != "selected"){
                if($value != null && $value != "" && $value != "null"){
                    $col[] = "`".$key."`";
                    $val[] = "'".$value."'";
                }
                    
            }
            
        }
        
        $query = "INSERT INTO `".$db."`.`".$tbl."` (".implode(",",$col).") VALUES (".implode(",",$val).");";
    }
    if($type == 'edit'){
        $dat = array();
        $con = array();
        $indKey = $params['key'];
        $contentB = $params['contentB'];
        //print_r($params['contentB']);
        foreach($content as $key=>$value){
            if($key != "add" && $key != "edit" && $key != "removed" && $key != "selected"){
                if($content[$key] != $contentB[$key])
                    $dat[] =  "`".$key."` = '".$value."'";
                    if(is_null($contentB[$key]))
                        $con[] =    "`".$key."` IS NULL ";
                    else if($contentB[$key] == "")
                        $con[] =    "`".$key."` = ''";
                    else
                        $con[] =    "`".$key."` = '".$contentB[$key]."'";
            }
            
        }
        if($indKey != ""){
            $con = "`".$indKey."` = ".$content[$indKey];
            $query = "UPDATE `".$db."`.`".$tbl."` SET ".implode(",",$dat)." WHERE  ".$con." ;";
        }
        else
            $query = "UPDATE `".$db."`.`".$tbl."` SET ".implode(",",$dat)." WHERE  ".implode(" AND ",$con)." LIMIT 1;";
        
    }
    if($type == 'del'){
        $con = array();
        $indKey = $params['key'];
        $contentB = $params['contentB'];
        //print_r($params['contentB']);
        foreach($content as $key=>$value){
            if($key != "add" && $key != "edit" && $key != "removed" && $key != "selected"){
                
                    if(is_null($contentB[$key]))
                        $con[] =    "`".$key."` IS NULL ";
                    else if($contentB[$key] == "")
                        $con[] =    "`".$key."` = ''";
                    else
                        $con[] =    "`".$key."` = '".$contentB[$key]."'";
            }
            
        }
        if($indKey != ""){
            $con = "`".$indKey."` = ".$content[$indKey];
            $query = "DELETE FROM  `".$db."`.`".$tbl."` WHERE  ".$con." ;";
        }
        else
            $query = "DELETE FROM `".$db."`.`".$tbl."` WHERE  ".implode(" AND ",$con)." LIMIT 1;";
    }
    $error = "";
    $pql = $mysql;
    
    $pql->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $pql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $ai[0][0] = 0;
    
    try{
        $prep = $pql->prepare($query);
	$prep->execute();
        $ai = [];
        $q = "SELECT `AUTO_INCREMENT` FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '".$db."' AND   TABLE_NAME   = '".$tbl."';";
        foreach($pql->query($q) as $ain){
                $ai[] = $ain;
        }
        //print_r($ai);
        
    } catch (Exception $ex) {
        $error = $ex->getMessage().': query = '.$query;
    }
    //print_r($ai);
    
    $result = array(
        "query" => $query,
        "error" => $error,
        "index" => $params['index'],
        "ai" => $ai[0][0]
    );
    echo json_encode($result);
}

function getTableDetail(){
    global $mysql;
    global $params;
    $db = $params['dbname'];
    $tbl = $params['tblname'];
    $order = "";
    
    if(isset($params['order'])){
        $order_string = [];
        foreach($params['order'] as $item)
            $order_string[] = " ".$item["col"]." ".$item["sort"]." ";
        if(count($order_string) > 0)
            $order = ' ORDER BY '.implode(',',$order_string);
        else
            $order = "";
        //echo $order;
    }
    if($params['page'] == 1)
        $query = "SELECT * FROM `".$db."`.`".$tbl."` ".$order." LIMIT 50";
    else{
        $cur = 50*($params['page']-1);
        $query = "SELECT * FROM `".$db."`.`".$tbl."` ".$order." LIMIT ".$cur.",50";
    }
    
    $array = [];
	$prep = $mysql->prepare($query);
	$prep->execute();
    while($data = $prep->fetch(PDO::FETCH_ASSOC)){
            $array[] = $data;
    }
    //Getting table total
    $quer = "SELECT count(*) as total FROM `".$db."`.`".$tbl."`";
    
    $arrayT = [];
    try{
        foreach($mysql->query($quer) as $data){
            $arrayT[] = $data;
        }
    } catch (Exception $ex) {
        $error = $ex->getMessage();
    }
    
    
    
    //Getting table creation
    //$arrayV = getTableCreationDetail($tbl,$db);
    //$arrayF = getTableForeignKeys($tbl,$db);
    //print_r($arrayF);
    
    
    $result = array(
        "data" => $array,
        "creation" => [],//$arrayV,
        "total" => $arrayT,
        "foreign" => [],//$arrayF,
        "query" => $query
    );
    echo json_encode($result);
}

function getTableData(){
    global $mysql;
    global $params;
    $db = $params['dbname'];
    $tbl = $params['tblname'];
    $order = "";
    
    if(isset($params['order'])){
        $order_string = [];
        foreach($params['order'] as $item)
            $order_string[] = " ".$item["col"]." ".$item["sort"]." ";
        if(count($order_string) > 0)
            $order = ' ORDER BY '.implode(',',$order_string);
        else
            $order = "";
        //echo $order;
    }
    if($params['page'] == 1)
        $query = "SELECT * FROM `".$db."`.`".$tbl."` ".$order." LIMIT 50";
    else{
        $cur = 50*($params['page']-1);
        $query = "SELECT * FROM `".$db."`.`".$tbl."` ".$order." LIMIT ".$cur.",50";
    }
    
    $array = [];
	$prep = $mysql->prepare($query);
	$prep->execute();
    while($data = $prep->fetch(PDO::FETCH_ASSOC)){
            $array[] = $data;
    }
    //Getting table total
    $quer = "SELECT count(*) as total FROM `".$db."`.`".$tbl."`";
    
    $arrayT = [];
    try{
        foreach($mysql->query($quer) as $data){
            $arrayT[] = $data;
        }
    } catch (Exception $ex) {
        $error = $ex->getMessage();
    }
    
    
    
    //Getting table creation
    $arrayV = getTableCreationDetail($tbl,$db);
    //$arrayF = getTableForeignKeys($tbl,$db);
    
    
    $result = array(
        "data" => $array,
        "total" => $arrayT,
        "creation" => $arrayV,
        "query" => $query
    );
    echo json_encode($result);
}

function getTableCreationDetail($tbl,$db){
    global $mysql;
    
    $query = "SHOW KEYS FROM  `".$db."`.`".$tbl."`";
    //echo $query;
    $key = [];
    foreach($mysql->query($query) as $data){
        //print_r($data);
            $key[] = array(
                0 => $data["Column_name"],
                1 => $data["Index_type"]
            );
            
    }
    
    $query = "SELECT * 
                FROM `INFORMATION_SCHEMA`.`COLUMNS` 
                WHERE `TABLE_SCHEMA`='".$db."' 
                AND `TABLE_NAME`='".$tbl."';";
    
    $array = [];
    //$arrayF = getTableForeignKeys($tbl,$db);
    try{
        foreach($mysql->query($query) as $data){
                $keyName = $data["COLUMN_KEY"];
                if($data["COLUMN_KEY"] == "MUL"){
                    for($i=0;$i<count($key);$i++){
                        if($key[$i][0] == $data["COLUMN_NAME"]){
                            if($key[$i][1] == 'BTREE')
                                $data["COLUMN_KEY"] = 'KEY';
                            else
                                $data["COLUMN_KEY"] = $key[$i][1];

                        }
                    }
                }
                /*if($data["COLUMN_KEY"] == 'KEY'){
                    for($i=0;$i<count($arrayF);$i++){
                        if($data["COLUMN_NAME"] == $arrayF[$i]['column'])
                            $data["COLUMN_KEY"] = 'FK';
                    }
                }*/
                
                if($data["EXTRA"] == "auto_increment"){
                    $data["COLUMN_DEFAULT"] = "AUTO_INCREMENT";
                }
                $array[] = array(
                    "name" => $data["COLUMN_NAME"],
                    "index" => $data["COLUMN_NAME"],
                    "position" => $data["ORDINAL_POSITION"],
                    "default" => $data["COLUMN_DEFAULT"],
                    "isNull" => ($data["IS_NULLABLE"] == 'YES'? 1 : 0),
                    //"type" => $data["DATA_TYPE"],
                    "type_small" => strtoupper($data["DATA_TYPE"]),
                    "unsigned" => 0,
                    "length" => $data["CHARACTER_MAXIMUM_LENGTH"],
                    "type" => $data["COLUMN_TYPE"],
                    "key" => $data["COLUMN_KEY"],
                    "comment" => $data["COLUMN_COMMENT"],
                    "selected" => 0
                );

    //            /echo "DDD : ".(strpos("papa unsigned","unsigned"));
        }
    } catch (Exception $ex) {
        echo $ex->getMessage();
    }
    
    
    
    
    for($i = 0;$i<count($array);$i++){
        $array[$i]["unsigned"] = (strpos($array[$i]["type"],"unsigned") == false ? 0 : 1);
        $array[$i]["length"] = ($array[$i]["length"] != "")? $array[$i]["length"] : getInBetween('(',')',$array[$i]["type"]);
    }
    return $array;
}





function getInBetween($start,$end,$string){
    
    $string = ' ' . $string;
    $ini = strpos($string, $start);
    if ($ini == 0) return '';
    $ini += strlen($start);
    $len = strpos($string, $end, $ini) - $ini;
    $val = substr($string, $ini, $len);
    //echo $val;
    return $val;
}


function getListofTableColumns(){
    global $params;
    $tbl = $params["table"];
    $db = $params["dbname"];
    $rersult = getTableCreationDetail($tbl,$db);
    echo json_encode($rersult);
}


function _query(){
    global $params;
    $db = $params['db'];
    global $url;
    $array = array();
    try{
        $mysql;
        if( $db == "0"){
            $mysql = new PDO("mysql:host=".$url,UN,PW);
        }
        else{
            $mysql = new PDO("mysql:host=".$url.";dbname=".$db,UN,PW);
        }
        
        $mysql->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $query = $params['query'];
        $prep = $mysql->prepare($query);
        $prep->execute();
        
        while($data = $prep->fetch(PDO::FETCH_ASSOC)){
            $array[] = $data;
        }

        if(isset($params['tbl'])){
            $tbl = $params['tbl'];
            //$arrayV = getTableCreationDetail($tbl,$db);
            //$arrayF = getTableForeignKeys($tbl,$db);
            $result = array(
                "success" => true,
                "data" => array(
                    "creation" => [],//$arrayV,
                    "foreign" => [],//$arrayF
                )
            );
            
        }
        else{
            $result = array(
                "success" => true,
                "data" => $array
            );
        }
        echo json_encode($result);
        
    } catch (PDOException $e) {
        $result = array(
            "error" => $e->getMessage()
        );
        http_response_code(400);
        echo json_encode($result);
    }
}