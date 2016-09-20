<?php

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

/**
 * Function to get Database List
 */
function getDatabaseList(){
    $sql = 'SHOW DATABASES';
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array[] = array(
                    "name" => $data['Database'],
                    "active" => "0",
                    "load" => ""
                );
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}

/**
 * Function to get Host Detail
 */
function getHostDetails(){
    $sql = 'select count(distinct table_schema) as db,count(distinct table_name) as tbl from information_schema.`TABLES`';
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array[] = $data;
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}

/**
 * Function to get Help Categories
 * @global PDO $mysql
 */
function getHelpCategory(){
    $sql = 'SELECT * FROM `mysql`.`help_category`';
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array[] = array(
                    "name" => $data['name'],
                    "active" => "0",
                    "index" => $data['help_category_id']
                );
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}
/**
 * Fucntion to get Help Topics
 * @global PDO $mysql
 */
function getHelpCategoryTopics(){
    $id = $_GET['cat'];
    $sql = 'SELECT topic.help_topic_id,topic.name FROM `mysql`.`help_topic` as topic WHERE topic.help_category_id = '.$id;
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array[] = array(
                    "name" => $data['name'],
                    "active" => "0",
                    "index" => $data['help_topic_id']
                );
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}

/**
 * Function to get topic details
 * @global PDO $mysql
 */
function getHelpTopic(){
    $id = $_GET['topic'];
    $sql = 'SELECT * FROM `mysql`.`help_topic` as topic WHERE topic.help_topic_id = '.$id;
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array = array(
                    "name" => $data["name"],
                    "description" => $data["description"],
                    "url" => $data["url"],
                    "example" => $data["example"]
                );
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}

/**
 * Getting collation list
 * @global PDO $mysql
 */

function getCollationList(){
    $sql = 'SELECT `id`,`collation_name` FROM `information_schema`.`collations`;';
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array[] = array(
                    "name" => $data["collation_name"],
                    "index" => $data["id"]
                );
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}

/**
 * Getting Engine list
 * @global PDO $mysql
 */
function getEngineList(){
    $sql = "SELECT `engine` FROM `information_schema`.`engines` WHERE `support` != 'no' ;";
    $array = [];
    
    try{
        global $mysql;
        foreach($mysql->query($sql) as $data ){
                $array[] = array(
                    "name" => $data["engine"]
                );
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
    }
    
    echo json_encode($array);
}



function getDatabaseDetail(){
    $db = $_GET['dbname'];
    global $mysql;
    $query = "USE `".$db."`;";
    $mysql->query($query);
    $query = "SELECT * FROM `information_schema`.`Tables` t
WHERE t.`table_schema` = '".$db."'
AND t.table_type = 'BASE TABLE';";
    $array = [];
    foreach($mysql->query($query) as $data ){
            $array[] = array(
                "name" => $data['TABLE_NAME'],
                "rows" => $data['TABLE_ROWS'],
                "size" => (($data['INDEX_LENGTH']*2)/1024),
                "created" =>$data['CREATE_TIME'],
                "updated"=>$data['UPDATE_TIME'],
                "engine" =>$data['ENGINE'],
                "comment" => $data['TABLE_COMMENT'],
                "row_format" => $data['ROW_FORMAT'],
                "auto_incr" => $data['AUTO_INCREMENT'],
                "collation" => $data['TABLE_COLLATION'],
                "type"=>"Table"
            );
             
    }
    echo json_encode($array);
}

function updateTable(){
    global $mysql;
    global $params;
    $error = "";
    $contentB = [];
    $columns = [];
    $tableCount = 1;
    foreach($params['data'] as $data){
        if(isset($data['contentB'])){
            $contentB = $data['contentB'];
            break;
        }
        else
            $contentB = [];
    }
    
    
    
    foreach($params['data'] as $data){
        //print_r($data);
        $db = trim($data['dbname']);
        $tbl = trim($data['tblname']);
        $tbl2 = "";
        $content = $data['content'];
        if(count($contentB)>0){
            $q = "SELECT count(*) as dat
                FROM information_schema.tables
                WHERE table_schema = '".$db."' 
                    AND table_name = '".$tbl."' ;";
            
            foreach($mysql->query($q) as $cnt ){
                $tableCount = $cnt[0];
            }
            
        }
        
        
        
        $type = $data['type'];
        //print_r($data);
        if($type != 'table' && $type != "fk_edit" && $type !="fk_add" && $type != "fk_drop"){
            $null = "NULL";
            if($content["isNull"] == 0 || $content["isNull"] == "0"){
                $null = "NOT NULL";
            }

            $after = "";
            if(isset($content["after"])){
                $after = " AFTER `".$content["after"]."` ";
            }

            $def = ' DEFAULT NULL ';
            if($content["default"] != ""){
               $def = " DEFAULT '".$content["default"]."' ";
               if($content["default"] == 'AUTO_INCREMENT')
                   $def = " AUTO_INCREMENT ";
               if($content["default"] == "ON UPDATE CURRENT_TIMESTAMP")
                   $def = " DEFAULT ' ' ON UPDATE CURRENT_TIMESTAMP ";
            }

            $com = "";
            if($content["comment"] != ""){
               $com = " COMMENT '".$content["comment"]."' ";
            }


            $uns = "";
            if($content["unsigned"] == 1 || $content["unsigned"] == "1" ){
                $uns = ' UNSIGNED ';
            }

        //    /$key = "";
            switch($content["key"]){
                case 'PRI':
                    $key = 'PRIMARY';
                    break;
                case 'UNI' :
                    $key = 'UNIQUE';
                    break;
                default :
                    $key = "";

            }
        }
        global $url;
        $pql = new PDO("mysql:host=".$url.";dbname=".$db,UN,PW);//$mysql;
        $pql->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
        $pql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        if($type != 'table' && $type != "fk_edit" && $type !="fk_add" && $type != "fk_drop")
            $columns[] = "`".$content["name"]."` ".$content["type_small"]."(".$content["length"].") ".$uns." ".$null." DEFAULT ".$def." ".$com.' '.$after;
        else if($type == 'table')
            $tbl2 = $content['name'];
            
       
        
        //echo $tableCount;
            
        if($tableCount == 1){
            if($type == 'add')
                $query = "ALTER TABLE `".$db."`.`".$tbl."` ADD COLUMN `".$content["name"]."` ".$content["type_small"]."(".$content["length"].") ".$uns." ".$null." ".$def." ".$com.' '.$after;
            if($type == 'update')
                $query = "ALTER TABLE `".$db."`.`".$tbl."` CHANGE COLUMN `".$content["index"]."` `".$content["name"]."` ".$content["type_small"]."(".$content["length"].") ".$uns." ".$null." ".$def." ".$com.' '.$after;
            if($type == 'drop')
                $query = "ALTER TABLE `".$db."`.`".$tbl."` DROP COLUMN `".$content["index"]."`;";
            if($type == 'index')
                //$query = "ALTER TABLE `".$db."`.`".$tbl."` ADD ".$key." KEY (`".$content["index"]."`);";
                $query = "ALTER TABLE `".$db."`.`".$tbl."` ADD ".$key." INDEX `".$content["index"]."` (`".$content["index"]."`);";
            if($type == 'indexDrop')
                $query = "ALTER TABLE `".$db."`.`".$tbl."` DROP INDEX `".$content["index"]."`;";
            if($type == 'fk_drop')
                $query = "ALTER TABLE `".$db."`.`".$tbl."` DROP FOREIGN KEY `".$content["index"]."`;";
            if($type == 'fk_edit')
                $query = "USE `".$db."`;".
                        "ALTER TABLE `".$db."`.`".$tbl."` DROP FOREIGN KEY `".$contentB["index"]."` ; ALTER TABLE `".$db."`.`".$tbl."` ADD CONSTRAINT `".$content["name"]."` FOREIGN KEY `".$tbl."` (`".$content["column"]."`) REFERENCES `".$content["reference"]."` (`".$content["ref_col"]."`) ON UPDATE ".$content["update"]." ON DELETE ".$content["delete"].";";
            
            if($type == 'fk_add')
                $query = "ALTER TABLE `".$db."`.`".$tbl."` ADD CONSTRAINT `".$content["name"]."` FOREIGN KEY `".$tbl."` (`".$content["column"]."`) REFERENCES `".$content["reference"]."` (`".$content["ref_col"]."`) ON UPDATE ".$content["update"]." ON DELETE ".$content["delete"].";";
            if($type == 'table'){
                $ren = 0;
                
                if($tbl != $content["name"]){
                    $query = "RENAME TABLE `".$db."`.`".$tbl."` TO `".$db."`.`".$content["name"]."` ; ";
                    $prep = $pql->prepare($query);
                    $prep->execute();
                    $tbl = $content["name"];
                }    
                else
                    $query = "";
                foreach($content as $keys=>$value){
                    if(isset($contentB[$keys]) && $content[$keys] != $contentB[$keys]){
                        switch($keys){
                            case 'auto_incr':
                                $key = "AUTO_INCREMENT";
                                $dat[] =  $key." = '".$value."'";
                                break;
                            case 'collation' :
                                $key = "COLLATE";
                                $dat[] =  $key." = '".$value."'";
                                break;
                            case 'comment' :
                                $key = "COMMENT";
                                $dat[] =  $key." = '".$value."'";
                                break;
                            case 'row_format' :
                                $key = "ROW_FORMAT";
                                $dat[] =  $key." = '".$value."'";
                                break;
                        }
                    }
                }
                if(isset($dat))
                    $query = "ALTER TABLE `".$db."`.`".$tbl."` ".implode(",",$dat)."; ";
                else
                    $query = "";
            }
        }
        
        else if($tableCount == 0){
            $query = "";
            $tbl = $content['name'];
        }

        
        
        try{
            if($query != ""){
                $prep = $pql->prepare($query);
                $prep->execute();
            }
            

        } catch (Exception $ex) {
            $error = $ex->getMessage().': query = '.$query;
            
            break;
        }
        
    }
    
    
    if($query == "" ){
        $query = "CREATE TABLE `".$db."`.`".$tbl2."` (
                        ".implode(',',$columns)."
                )
                COLLATE='latin1_swedish_ci'
                ENGINE=InnoDB
                ;";
        
        try{
            if($query != ""){
                $prep = $pql->prepare($query);
                $prep->execute();
                $query = "";
                $error = "";
            }
            

        } catch (Exception $ex) {
            $error = $ex->getMessage().': query = '.$query;
            $query = "";
            //break;
        }
    }
    
    if($tbl2 == ""){
        $arrayV = getTableCreationDetail($tbl,$db);
        $arrayF = getTableForeignKeys($tbl,$db);
    } 
    else if($tbl2 != "" && count($columns)>0){
        $arrayV = getTableCreationDetail($tbl2,$db);
        $arrayF = getTableForeignKeys($tbl,$db);
        
    } 
    else{
        $arrayV = [];
        $arrayF = [];
    }
    
    
    $result = array(
        "creation" => $arrayV,
        "foreign" => $arrayF,
        "error" => $error
    );
    //print_r($result);
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
    $arrayV = getTableCreationDetail($tbl,$db);
    $arrayF = getTableForeignKeys($tbl,$db);
    
    
    $result = array(
        "data" => $array,
        "creation" => $arrayV,
        "total" => $arrayT,
        "foreign" => $arrayF,
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


function getTableForeignKeys($tbl,$db){
    global $mysql;
    
    
    $query = "SELECT RT.CONSTRAINT_NAME,RT.UPDATE_RULE,RT.DELETE_RULE,RT.REFERENCED_TABLE_NAME,RT.TABLE_NAME,KC.COLUMN_NAME,KC.REFERENCED_COLUMN_NAME FROM `INFORMATION_SCHEMA`.`REFERENTIAL_CONSTRAINTS` RT,`INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE` KC
                WHERE RT.CONSTRAINT_SCHEMA = '".$db."'
                AND RT.TABLE_NAME = '".$tbl."'
                AND RT.CONSTRAINT_NAME = KC.CONSTRAINT_NAME;";
    
    $array = [];
    try{
        foreach($mysql->query($query) as $data){
                //$keyName = $data["COLUMN_KEY"];
               
                $array[] = array(
                    "name" => $data["CONSTRAINT_NAME"],
                    "index" => $data["CONSTRAINT_NAME"],
                    "update" => $data["UPDATE_RULE"],
                    "delete" => $data["DELETE_RULE"],
                    "reference" => $data["REFERENCED_TABLE_NAME"],
                    "table" => $data["TABLE_NAME"],
                    "column" => $data["COLUMN_NAME"],
                    "ref_col" => $data["REFERENCED_COLUMN_NAME"]
                );
        }
    } catch (Exception $ex) {
        echo $ex->getMessage();
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

/**
 * @author PRANAY KATIYAR <pranay.k.katiyar@gmail.com>
 * @global type $params
 * @global PDO $mysql
 */
function dropTable(){
    global $params;
    global $mysql;
    
    $db = $params['dbname'];
    $tbl = $params['tblname'];

    $query = "DROP TABLE `" . $db . "`.`" . $tbl . "`;
              SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;";
    //echo $query;
    $error = "";
    try{
        $prep = $mysql->prepare($query);
        $prep->execute();
    } catch (Exception $ex) {
        $error = $ex->getMessage().': query = '.$query;
    }
    $result = array(
        "error" => $error
    );
    
    echo json_encode($result);
}


/**
 * @author Pranay Katiyar <pranay.k.katiyar@gmail.com>
 * @global type $params
 * @global PDO $mysql
 */
function emptyTable(){
    global $params;
    global $mysql;
    
    $db = $params['dbname'];
    $tbl = $params['tblname'];
        
    $query = "TRUNCATE `".$db."`.`".$tbl."`;";
    //echo $query;
    $error = "";
    try{
        $prep = $mysql->prepare($query);
        $prep->execute();
    } catch (Exception $ex) {
        $error = $ex->getMessage().': query = '.$query;
    }
    $result = array(
        "error" => $error
    );
    
    echo json_encode($result);
}

function createDatabase(){
    global $params;
    global $mysql;
    
    $db = $params['dbname'];
        
    $query = "CREATE DATABASE `".$db."`;";
    //echo $query;
    $error = "";
    try{
        $prep = $mysql->prepare($query);
        $prep->execute();
    } catch (Exception $ex) {
        $error = $ex->getMessage().': query = '.$query;
    }
    $result = array(
        "error" => $error
    );
    
    echo json_encode($result);
}

function dropDatabase(){
    global $params;
    global $mysql;
    
    $db = $params['dbname'];
        
    $query = "DROP DATABASE `".$db."`;";
    //echo $query;
    $error = "";
    try{
        $prep = $mysql->prepare($query);
        $prep->execute();
    } catch (Exception $ex) {
        $error = $ex->getMessage().': query = '.$query;
    }
    $result = array(
        "error" => $error
    );
    
    echo json_encode($result);
}

function getListofTableColumns(){
    global $params;
    $tbl = $params["table"];
    $db = $params["dbname"];
    $rersult = getTableCreationDetail($tbl,$db);
    echo json_encode($rersult);
}