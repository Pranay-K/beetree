
//var mql = angular.module('mql',[]);
var mql = angular.module('mql',['ui.bootstrap.contextMenu','pasvaz.bindonce']);
mql.controller('mainCtrl',["$scope","$http","$sce",function($scope,$http,$sce){
    extScope = $scope;
    $scope.title = 'Localhost';
    $scope.tabIndex = 'Localhost';
    $scope.tableTabIndex = 'Basic';
    $scope.databaseTag = "<span class='fa fa-database'></span> Database";
    $scope.tableTag = "<span class='fa fa-table'></span> Table";
    $scope.dbName = "";
    $scope.dbIndex = 0;
    $scope.tblName;
    $scope.tableColumns = [];
    
    //Variable for query window
    $scope.queryResult = [];
    $scope.queryTableKeys = [];
    //DEFAULT VALUE CONTEXT MENU
    
    $scope.defaultOptions = [
        ['<span class="fa fa-table"></span> AUTO_INCREMENT', function ($itemScope) {
            //$itemScope.$index
            $itemScope.tableCreation[$itemScope.$index].default = 'AUTO_INCREMENT';
        }],
        ['<span class="fa fa-table"></span> NULL', function ($itemScope) {
            //$itemScope.$index
            $itemScope.tableCreation[$itemScope.$index].default = null;
        }],
        ['<span class="fa fa-table"></span> NO DEFAULT', function ($itemScope) {
            //$itemScope.$index
            $itemScope.tableCreation[$itemScope.$index].default = ' ';
        }],
        ['<span class="fa fa-table"></span> ON UPDATE CURRENT TIMESTAMP', function ($itemScope) {
            //$itemScope.$index
            $itemScope.tableCreation[$itemScope.$index].default = 'ON UPDATE CURRENT_TIMESTAMP';
        }]
    ];
    
    //DATABASE Context menu
    $scope.menuOptions = [
        ['<span class="fa fa-table"></span> Select', function ($itemScope) {
            var dbName = $itemScope.database[$itemScope.$index].name;
            $itemScope.selectDb($itemScope.$index);
        }],
        
        ['<span class="fa fa-remove"></span> Drop', function ($itemScope) {
            var dbName = $itemScope.database[$itemScope.$index].name;
            var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'dropDatabase',dbname: dbName}
                }
        $http(req)
        .then(function(response){
                if(response.data.error == "")
                    $itemScope.database.splice($itemScope.$index,1);
                $scope.checkError(response.data.error);
              }); 
        }],
        null, // Divider
        ['<span class="fa fa-plus"></span> Create New', function ($itemScope) {
            $scope.items.splice($itemScope.$index, 1);
        },
            [
                ['<span class="fa fa-table"></span> Table', function ($itemScope) {
                    $itemScope.addTable();
                }]
            ]
        ]
    ];
    //TABLE CONTEXT MENU
    $scope.tableMenuOptions = [
        ['<span class="fa fa-edit"></span> Edit', function ($itemScope) {
            
            var dbName = $itemScope.dbName;
            var dbIndex;
            for(var i=0;i<$itemScope.database.length;i++){
                if($itemScope.database[i].name == dbName)
                    dbIndex = i;
            }
            var tableName = $itemScope.database[dbIndex].table[$itemScope.$index].name;
            $itemScope.selectTable(dbName,tableName);
        }],
        ['<span class="fa fa-remove"></span> Drop', function ($itemScope) {
            
            var dbName = $itemScope.dbName;
            var dbIndex;
            for(var i=0;i<$itemScope.database.length;i++){
                if($itemScope.database[i].name == dbName)
                    dbIndex = i;
            }
            
            var tableName = $itemScope.database[dbIndex].table[$itemScope.$index].name;
            var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'dropTable',dbname: dbName,tblname:tableName}
                }
        $http(req)
        .then(function(response){
                if(response.data.error == "")
                    $itemScope.database[dbIndex].table.splice($itemScope.$index,1);
                $scope.checkError(response.data.error);
              }); 
        }],
        ['<span class="fa fa-eraser"></span> Empty Table', function ($itemScope) {
            var dbName = $itemScope.dbName;
            var dbIndex;
            for(var i=0;i<$itemScope.database.length;i++){
                if($itemScope.database[i].name == dbName)
                    dbIndex = i;
            }
            
            var tableName = $itemScope.database[dbIndex].table[$itemScope.$index].name;
            var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'emptyTable',dbname: dbName,tblname:tableName}
                }
        $http(req)
        .then(function(response){
                if(response.data.error == "")
                    $itemScope.selectTable(dbName,tableName);
                $scope.checkError(response.data.error);
              }); 
        }],
        null, // Divider
        ['<span class="fa fa-plus"></span> Create New', function ($itemScope) {
            $scope.items.splice($itemScope.$index, 1);
        },
            [
                ['<span class="fa fa-table"></span> Table', function ($itemScope) {
                    $itemScope.addTable();
                }]
            ]
        ]
    ];
    
    
    
    
    
    $scope.checkTableChange = function(){
        //alert('data');
        $scope.tableDetailChange = 1;
        $scope.selectedTable.change = 1;
    }
    
    //$scope.selectedTable = 
    $scope.to_trusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    }

    //Defining Table Column Types
    //$scope.columnType = columnData;

    //parameters, menugroup, menuitem
    
    $scope.menuTabbing = function(group,name){
        switch(group){
            case 'TableData':
                if($scope.tabIndex != group)
                    return 'disabled';
                else{
                    if (name == "commit" || name == 'discard') {
                        var found = 0;
                        for (var i=0;i<$scope.tableDetail.length;i++){
                            if($scope.tableDetail[i].add == 1 || $scope.tableDetail[i].edit == 1 || $scope.tableDetail[i].removed == 1)
                                found++;
                        }
                        if(found == 0)
                            return 'disabled';
                        //else 
                            //return 'animated tada';
                    }
                }
                break;
            case 'Query':
                var found = 0;
                for(var i=0;i<$scope.tabs.length;i++){
                    if($scope.tabs[i].type == 'query' && $scope.tabs[i].active == 1)
                        found++;
                }
                if(found == 0)
                    return 'disabled';
                //else
                    //return 'animated tada';
        }
    }

    //Defining tabs
    $scope.tabs = [
        {
            "name" : "Localhost",
            "display" : "<span class='fa fa-cubes'></span> Localhost",
            "view" : "views/_localhost.html",
            "active" : 1
        },{
                "name" : "Plus",
                "display" : "<span class='fa fa-plus'></span>",
                "active" : 0
            }

    ];
    //Defining table detail tabs
    $scope.tableTabs = [
        {
            "name" : "Basic",
            "display" : "<span class='fa fa-table'></span> Basic",
            "active" : 1
        },
        {
            "name" : "Options",
            "display" : "<span class='fa fa-wrench'></span> Options",
            "active" : 0
        },
        {
            "name" : "Indexes",
            "display" : "<span class='fa fa-anchor'></span> Indexes",
            "active" : 0
        },
        {
            "name" : "FKeys",
            "display" : "<span class='fa fa-exchange'></span> FKeys",
            "active" : 0
        }


    ];


    /*Removing tabs*/
    $scope.removeTab = function(){
        alert('hi');
    }

    /*Foreign key changes */
    $scope.checkForeignKeyChange = function($index,ed = 0){
        if($scope.tableForeignKeys[$index].add != 1 && $scope.tableForeignKeys[$index].remove != 1)
            $scope.tableForeignKeys[$index].change = 1;
        if(ed == 0)
            $scope.tableForeignKeys[$index].name = $scope.tableForeignKeys[$index].table+'_'+$scope.tableForeignKeys[$index].reference+'_FK';
        $scope.tableDetailChange = 1;
    }

    /*
    Called on tab changes
    */
    $scope.clearTabs = function(tabName){
        if(tabName == "Plus"){
            var index = 1;
            for(var i = 0;i<$scope.tabs.length;i++){
                $scope.tabs[i].active = 0;
                if($scope.tabs[i].type == 'query'){
                    if(index == $scope.tabs[i].incr)
                        index = $scope.tabs[i].incr+1;
                }
            }
            var name = 'Query'+index;

            var tab = {
                "name" : name,
                "display" : "<span class='fa fa-flash'></span> "+name+" <span class='fa fa-close orange' onclick='removeTab("+index+")'></span>",
                "active" : 1,
                "view" : "views/_query.html",
                "incr":index,
                "type":"query"
            };
            $scope.tabs.pop();
            $scope.tabs.push(tab);
            $scope.tabs.push(addTab);
            $scope.tabIndex = name;
            /*var div = document.getElementById('tabData');
            var node = document.createElement("div");
            var attr = document.createAttribute("ng-if");
            attr.value = "tabIndex == '"+name+"'";
            node.setAttributeNode(attr);
            attr = document.createAttribute("ng-include");
            attr.value = "'views/_tableDetails.html'"
            node.setAttributeNode(attr);
            attr = document.createAttribute("class");
            attr.value = 'ng-scope';
            node.setAttributeNode(attr);
            div.appendChild(node);*/
            return;
        }
        var active = 0;
        for(var i =0; i< $scope.tabs.length;i++){
            if($scope.tabs[i].name == tabName){
                active = i;
                $scope.tabs[i].active = 1;
            }
            else
                $scope.tabs[i].active = 0;
        }
        $scope.tabIndex = $scope.tabs[active].name;
    }

    /*
    Called on table tab changes
    */
    $scope.clearTableTabs = function(tabName){
        var active = 0;
        for(var i =0; i< $scope.tableTabs.length;i++){
            if($scope.tableTabs[i].name == tabName){
                active = i;
                $scope.tableTabs[i].active = 1;
            }
            else
                $scope.tableTabs[i].active = 0;
        }
        $scope.tableTabIndex = $scope.tableTabs[active].name;
    }



    /*
    Called on db selection and change============================================================
    */
    
    $scope.selectDb = function($index){
        $scope.dbName = $scope.database[$index].name;
        $scope.dbIndex = $index;
        var active = 0;
        for(var i =0; i< $scope.database.length;i++){
            $scope.database[i].active = 0;
        }
        $scope.database[$index].active = 1;
        active = $index;
        /**
        Indexing Tabs-------------------------------------------------------------
        */
        $scope.tabs.pop();
        var tabFound = 0;
        for(var q = 0;q<$scope.tabs.length;q++){
            if($scope.tabs[q].name == 'Database'){
                /* if db exist */
                $scope.tabs[q].display = $scope.databaseTag+" : <b><i><small>"+$scope.dbName+"</b></i></small>";
                $scope.tabs[q].active = 1;
                $scope.tabIndex = 'Database';
                tabFound = 1;
            }
            else{
                $scope.tabs[q].active = 0;
            }
        }
        if(tabFound==0){
            $scope.tabs.push(database);
            $scope.tabs[$scope.tabs.length-1].display = $scope.databaseTag+" : <b><i><small>"+$scope.dbName+"</b></i></small>";
            $scope.tabs[$scope.tabs.length-1].active = 1;
            $scope.tabIndex = 'Database';
        }
        $scope.tabs.push(addTab);
        //--------------------------------------------------------------------------
        // This call should happen only first TIMESTAMP
        //--------------------------------------------------------------------------
        //if(!$scope.database[active].table){
        $http.get(base_url+'?method=getDatabaseDetail&dbname='+$scope.dbName)
        .then(function(response){
                $scope.databaseDetail = response.data;
                var pdata=[];
                var size = 0;
                  for(var j=0;j<response.data.length;j++){
                      pdata.push({
                          "name" : response.data[j].name,
                          "load" : response.data[j].size,
                          "comment" : response.data[j].comment,
                          "row_format" : response.data[j].row_format,
                          "auto_incr" : response.data[j].auto_incr,
                          "collation" : response.data[j].collation,
                          "engine" : response.data[j].engine,
                          "active" : 0
                      });
                      size += response.data[j].size;
                  }
                $scope.database[active].table = pdata;
                
                $scope.database[active].load=size;
              }); 
        //}
    }
    
    /*
    * ON QUERY RUN --------------------------------------------------------------
    */
    
    $scope.runQuery = function(){
        var dbName = $scope.dbName;
        //alert(dbName);
        if(dbName == "" || dbName == undefined){
            alert("No Datase Selected !");
            return;
        }
        var query = $('.queryContent:visible').text();
        for(var i=0;i<$scope.tabs.length;i++){
            if($scope.tabs[i].type == 'query' && $scope.tabs[i].active == 1){
                //$scope.queryData[$tabs[i].name] = 
                var selected = i;
                var req = {
                         method: 'POST',
                         url: base_url,
                         headers: {
                           'Content-Type': undefined
                         },
                         data: { db : dbName ,method:'queryData',query: query}
                        }
                $http(req)
                .then(function(response){
                        console.log(response);
                        
                        if(response.data){
                            $scope.queryResult[$scope.tabs[selected].name] = response.data.data;
                            $scope.queryTableKeys[$scope.tabs[selected].name] = [];//Gets the columns of the table
                            for(var key in $scope.queryResult[$scope.tabs[selected].name][0]){
                                var item = {
                                    name : key,
                                    sort : 0
                                };
                                $scope.queryTableKeys[$scope.tabs[selected].name].push(item);
                            }
                        }
                      }); 
            }
        }
    }
    
    $scope.clearQuery = function(){
        $('.queryContent:visible').html('');
    }
    $scope.copyQuery = function(){
        var dat = $('.queryContent:visible').html();
        $scope.clearTabs('Plus');
        
        setTimeout(function(){ $('.queryContent:visible').html(dat); },250);
    }
    
    
    /*select help tab */
    
    $scope.addHelpTab = function(){
       var helpTab = {
                        "name" : "Help",
                        "display" : "<span class='fa fa-question'></span> Help <span class='fa fa-close orange' onclick='removeTab(99)'></span>",
                        "active" : 0,
                        "view" : "views/_helpData.html",
                        "incr" : 99
                    };
        
        $scope.tabs.pop();
        var tabFound = 0;
        for(var q = 0;q<$scope.tabs.length;q++){
            if($scope.tabs[q].name == 'Help'){
                $scope.tabs[q].active = 1;
                $scope.tabIndex = 'Help';
                tabFound = 1;
            }
            else{
                $scope.tabs[q].active = 0;
            }
        }
        if(tabFound==0){
            $scope.tabs.push(helpTab);
            $scope.tabs[$scope.tabs.length-1].active = 1;
            $scope.tabIndex = 'Help';
        }
        $scope.tabs.push(addTab);
        $http.get(base_url+'?method=getHelpCategory')
        .then(function(response){
              $scope.helpCategory = response.data;

          });
    }
    
    $scope.openSub = function($index,index){
        
        if($scope.helpCategory[$index].active == 0){
            for(var i=0;i<$scope.helpCategory.length;i++)
                $scope.helpCategory[i].active = 0;            
            $scope.helpCategory[$index].active = 1;
        }
        
        if(!$scope.helpCategory[$index].items && $scope.helpCategory[$index].active == 1){
            $http.get(base_url+'?method=getHelpCategoryTopics&cat='+$scope.helpCategory[$index].index)
                .then(function(response){
                      $scope.helpCategory[$index].items = response.data;
//                        $('#accordian').animate({
//                        scrollTop: $('#accordian > ul > li').eq($index).offset().top},
//                        'slow');
                  });
        }
        
    }
    
    $scope.helpTopic = function(topic){
        $http.get(base_url+'?method=getHelpTopic&topic='+topic)
                .then(function(response){
                      $scope.helpTopicData = response.data;
                  });
    }
    
    /*
    Table Details menu funcitons
    */
    $scope.addTableData = function(){
        var junk = [];
        var obj = {};
        for(var i=0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].default == '' || $scope.tableCreation[i].default == null){
                var index = $scope.tableCreation[i].index;
                obj[index] = 'null';
            }
                
            else if($scope.tableCreation[i].default == "AI")
                junk.push(($scope.tablePageTotal-1)*50+1);
            else
                junk.push($scope.tableCreation[i].default);
        }
        obj['add'] = 1;
        $scope.tableDetail.push(obj);
        
    }
    
    $scope.commitTableData = function(){
        if (!confirm('Are you sure you want to commit changes to database?')) {
            return
        } 
        var dbName = $scope.dbName;
        var tableName = $scope.tblName;
        for(var i=0;i<$scope.tableDetail.length;i++){
            if($scope.tableDetail[i].add == 1){
                var req = {
                         method: 'POST',
                         url: base_url,
                         headers: {
                           'Content-Type': 'application/json'
                         },
                         data: { method:'updateTableData',dbname: dbName,tblname:tableName,content:$scope.tableDetail[i],type:'add',index:i}
                        }
                $http(req)
                .then(function(response){
                        if(response.data.error != "")
                            $scope.checkError(response.data.error);
                        else{
                            var index = response.data.index;
                            delete $scope.tableDetail[index].add;
                            delete $scope.tableDetail[index].selected;
                            delete $scope.tableDetail[index].edit;
                            for(var i =0;i<$scope.tableCreation.length;i++){
                                if($scope.tableCreation[i].key == 'PRI')
                                $scope.tableDetail[index][$scope.tableCreation[i].name] = parseInt(response.data.ai)-1;
                            }
                            $scope.tableDetailBackup = angular.copy($scope.tableDetail);
                        }
                        
                      });
            }
            else if($scope.tableDetail[i].edit == 1){
                var key = "";
                for(var j =0;j<$scope.tableCreation.length;j++){
                    if($scope.tableCreation[j].key == 'PRI')
                        key = $scope.tableCreation[j].name;
                }
                var req = {
                         method: 'POST',
                         url: base_url,
                         headers: {
                           'Content-Type': 'application/json'
                         },
                         data: { method:'updateTableData',dbname: dbName,tblname:tableName,content:$scope.tableDetail[i],contentB:$scope.tableDetailBackup[i],type:'edit',index:i,key:key}
                        }
                $http(req)
                .then(function(response){
                        if(response.data.error != "")
                            $scope.checkError(response.data.error);
                        else{
                            var index = response.data.index;
                            delete $scope.tableDetail[index].add;
                            delete $scope.tableDetail[index].selected;
                            delete $scope.tableDetail[index].edit;

                            $scope.tableDetailBackup = angular.copy($scope.tableDetail);
                        }
                        
                      });
            }
            if($scope.tableDetail[i].removed == 1){
                var key = "";
                for(var j =0;j<$scope.tableCreation.length;j++){
                    if($scope.tableCreation[j].key == 'PRI')
                        key = $scope.tableCreation[j].name;
                }
                var req = {
                         method: 'POST',
                         url: base_url,
                         headers: {
                           'Content-Type': 'application/json'
                         },
                         data: { method:'updateTableData',dbname: dbName,tblname:tableName,content:$scope.tableDetail[i],contentB:$scope.tableDetailBackup[i],type:'del',index:i,key:key}
                        }
                $http(req)
                .then(function(response){
                        if(response.data.error != "")
                            $scope.checkError(response.data.error);
                        else{
                            var index = response.data.index;
                            $scope.tableDetail.splice(index,1)
    //                        delete $scope.tableDetail[index].add;
    //                        delete $scope.tableDetail[index].selected;
    //                        delete $scope.tableDet    ail[index].edit;

                            $scope.tableDetailBackup = angular.copy($scope.tableDetail);
                        }
                        
                      });
            }
        }
    }
    
    $scope.discardTableData = function(){
        angular.copy($scope.tableDetailBackup, $scope.tableDetail);
        
    }
    
    $scope.removeTableData = function(){
        var rem = [];
        for(var i=0;i<$scope.tableDetail.length;i++){
            if($scope.tableDetail[i].selected == 1){
                $scope.tableDetail[i].removed = 1;
                if($scope.tableDetail[i].add == 1){
                    delete $scope.tableDetail[i].add;
                    rem.push(i);
                }
                delete $scope.tableDetail[i].edit;
            }
        }
        for(var j=0;j<rem.length;j++)
            $scope.tableDetail.splice(rem[j],1);
    }
    
    $scope.refreshTableData = function(){
        $scope.sortTableData("");
    }
    
    $scope.getListofTableColumns = function(table,$index){
        var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'getListofTableColumns',table: table,dbname:$scope.database[$scope.dbIndex].name}
                }
        $http(req)
        .then(function(response){
            $scope.tableColumns[$index] = response.data;
        });
    }
    
    /*
    Select table =========================================================
    */
    $scope.selectTable = function(dbName,tableName,page=1,isPaging = false){
         $scope.dbName = dbName;
         $scope.tblName = tableName;
         console.log(page);
         if(!isPaging){
            for(var i=0;i<$scope.database.length;i++){
                if($scope.database[i].name == dbName){
                    for(var j=0;j<$scope.database[i].table.length;j++){
                        if($scope.database[i].table[j].name == tableName){
                            $scope.database[i].table[j].active = 1;
                            $scope.selectedTable = $scope.database[i].table[j];//angular.copy
                            $scope.selectedTableBackup = angular.copy($scope.selectedTable);
                            //console.log($scope.selectedTable);
                        }
                        else{
                            $scope.database[i].table[j].active = 0;
                            $scope.tblIndex = j;
                            //$scope.selectedTable = [];
                            //$scope.selectedTableBackup = [];
                        }
                    }
                }
            }
         }
        
        
        var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'getTableDetail',dbname: dbName,tblname:tableName,page:page}
                }
        $http(req)
        .then(function(response){
                $scope.tableDetail = response.data.data;//Contains the creation detail of table
                $scope.tableDetailBackup = angular.copy($scope.tableDetail);
                $scope.tableKeys = [];//Gets the columns of the table
                /*for(var key in $scope.tableDetail[0]){
                    var item = {
                        name : key,
                        sort : 0
                    };
                    $scope.tableKeys.push(item);
                }*/
                $scope.tableCreation = response.data.creation;
                for(var i=0;i<$scope.tableCreation.length;i++){
                    var item = {
                        name : $scope.tableCreation[i].name,
                        sort : 0
                    };
                    $scope.tableKeys.push(item);
                }
            
            
            //console.log($scope.tableKeys);
                //console.log($scope.tableKeys);
                $scope.tableCols = $scope.tableKeys.length;//Calculaing lenght of columns in table
                $scope.tableRows = $scope.tableDetail.length;//calculating length of rows in table
                $scope.tablePage = page;
                //$scope.tablePageTotal = 12;
                if(response.data.total[0])
                    $scope.tablePageTotal = parseInt((response.data.total[0].total/50)+1);
                $scope.tableCreation = response.data.creation;
                $scope.tableCreationBackup = angular.copy($scope.tableCreation);
                $scope.tableForeignKeys = response.data.foreign;
                $scope.tableForeignKeysBackup = angular.copy($scope.tableForeignKeys);
                if(!isPaging){
                    for(var k=0;k<$scope.tableForeignKeys.length;k++){
                        $scope.getListofTableColumns($scope.tableForeignKeys[k].reference,k);
                    }
                }
                //$scope.tableDataSet(response.data.creation)
              }); 




        if(!isPaging == true){
            /**
            Indexing Table  Tabs-------------------------------------------------------------
            */
            
            $scope.tabs.pop();
            var tabFound = 0;
            for(var q = 0;q<$scope.tabs.length;q++){
                if($scope.tabs[q].name == 'Table'){
                    /* if db exist */
                    $scope.tabs[q].display = $scope.tableTag+" : <b><i><small>"+tableName+"</b></i></small>";
                    $scope.tabs[q].active = 1;
                    $scope.tabIndex = 'Table';
                    tabFound = 1;
                }
                else{
                    $scope.tabs[q].active = 0;
                }
            }
            if(tabFound==0){
                $scope.tabs.push(table);
                $scope.tabs[$scope.tabs.length-1].display = $scope.tableTag+" : <b><i><small>"+tableName+"</b></i></small>";
                $scope.tabs[$scope.tabs.length-1].active = 1;
                $scope.tabIndex = 'Table';
            }

            /**
            Indexing Table Data Tabs-------------------------------------------------------------
            */


            var tabFound = 0;
            for(var q = 0;q<$scope.tabs.length;q++){
                if($scope.tabs[q].name == 'TableData'){
                    tabFound = 1;
                }
                else{
                    //$scope.tabs[q].active = 0;
                }
            }
            if(tabFound==0){
                $scope.tabs.push(tableData);
            }
            $scope.tabs.push(addTab);
        }
        
    }
    
    $scope.sortTableData = function(colName){
        var order = [];
        for(var i=0;i<$scope.tableKeys.length;i++){
            
            if($scope.tableKeys[i].name == colName){
                
                switch($scope.tableKeys[i].sort){
                    case 0:
                        $scope.tableKeys[i].sort = 1;
                        break;
                    case 1:
                        $scope.tableKeys[i].sort = -1;
                        break;
                    case -1:
                        $scope.tableKeys[i].sort = 0;
                        break;
                    default:
                        $scope.tableKeys[i].sort = 0;
                        break;
                }
                console.log($scope.tableKeys[i].sort);
            }
            if($scope.tableKeys[i].sort != 0){
                if($scope.tableKeys[i].sort == 1)
                    order.push({ col : $scope.tableKeys[i].name,sort:'ASC'});
                else
                    order.push({ col : $scope.tableKeys[i].name,sort:'DESC'});
            }
            
        }
        var dbName = $scope.dbName;
        var tableName = $scope.tblName;
        var page = $scope.tablePage;
        
        var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'getTableDetail',dbname: dbName,tblname:tableName,page:page,order:order}
                }
        $http(req)
        .then(function(response){
                $scope.tableDetail = response.data.data;
              });
    }

    $scope.tablePagin = function(pageNumber){
        $scope.selectTable($scope.dbName,$scope.tblName,pageNumber,true);
    }

    $scope.selectTableIndex = function($index){
        for(var i=0;i<$scope.tableCreation.length;i++){
            $scope.tableCreation[i].selected = 0;
        }
        $scope.tableCreation[$index].selected = 1;
    }
    
    $scope.addTable = function(){
        var dbIndex = null;
        if($scope.dbName){
            for(var i=0;i<$scope.database.length;i++){
                if($scope.database[i].name == $scope.dbName)
                    dbIndex = i;
            }
            $scope.database[dbIndex].table.push({name:"untitled",change:1,add:1});
            $scope.selectTable($scope.dbName,'untitled');
            $scope.tableDetailChange = 1;
            $scope.selectedTable = $scope.database[dbIndex].table[$scope.database[dbIndex].table.length-1];
            $scope.tableCreationBackup = angular.copy($scope.tableCreation);
            //$scope.database[dbIndex].table.selected = 1;
            console.log($scope.selectedTable);
        }
        
        else{
            alert('No Database Selected');
        }
    }
    //Table Detail Functions ----------------------
    $scope.addTableIndex = function(){
        var index = $scope.tableCreation.length + 1;
        var item = {
            "name" : "Column "+index,
            "position" : index,
            "default" : "",
            "isNull" : 1,
            //"type" => $data["DATA_TYPE"],
            "type_small" : "INT",
            "unsigned" : 0,
            "length" : 11,
            "type" : "int(11)",
            "key" : "",
            "comment" : "",
            "selected" : 0,
            "new" : 1
        }
        $scope.tableCreation.push(item);
        $scope.tableDetailChange = 1;
    }
    
    //Table Foreign Key add Function ----------------------
    $scope.addTableForeignKey = function(){
        var index = $scope.tableForeignKeys.length + 1;
        var item = {
            "column" : "",
            "delete" : "RESTRICT",
            "index" : "",
            "name" : "",
            "ref_col" : "",
            "reference" : "",
            "table" : $scope.selectedTable.name,
            "update" : "RESTRICT",
            "add" : 1
        }
        $scope.tableForeignKeys.push(item);
        console.log($scope.tableForeignKeys);
        $scope.tableDetailChange = 1;
    }
    
    
    
    
    
    $scope.saveTableDetail = function(){
//        console.log('saveTableDetail');
        var dbName = $scope.dbName;
        var tableName = $scope.tblName;
        var data = [];
        if($scope.selectedTable.change == 1 ){
            data.push({
                dbname : dbName,
                tblname : tableName,
                content : $scope.selectedTable,
                contentB : $scope.selectedTableBackup,
                type : 'table'
            });
        }
        
        for(var i=0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].new == 1){
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableCreation[i],
                    type : 'add'
                });
            }
            else if($scope.tableCreation[i].change == 1){
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableCreation[i],
                    type : 'update'
                });
                
            }
            else if($scope.tableCreation[i].removed == 1){
                console.log($scope.tableCreation[i]);
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableCreation[i],
                    type : 'drop'
                });
            }
            else if($scope.tableCreation[i].indexing == 1){
                if($scope.tableCreation[i].indexRemoved != 1){
                    data.push({
                        dbname : dbName,
                        tblname : tableName,
                        content : $scope.tableCreation[i],
                        type : 'index'
                    });
                }
            }
            else if($scope.tableCreation[i].indexRemoved == 1){
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableCreation[i],
                    type : 'indexDrop'
                });
            }
            

        }
        for(var i=0;i<$scope.tableForeignKeys.length;i++){
            if($scope.tableForeignKeys[i].change == 1){
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableForeignKeys[i],
                    contentB : $scope.tableForeignKeysBackup[i],
                    type : 'fk_edit'
                });
            }
            if($scope.tableForeignKeys[i].remove == 1){
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableForeignKeys[i],
                    //content : $scope.tableForeignKeysBackup[i],
                    type : 'fk_drop'
                });
            }
            if($scope.tableForeignKeys[i].add == 1){
                data.push({
                    dbname : dbName,
                    tblname : tableName,
                    content : $scope.tableForeignKeys[i],
                    //content : $scope.tableForeignKeysBackup[i],
                    type : 'fk_add'
                });
            }
        }
        //console.log(data);
        var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'updateTable',data:data }
                }
        $http(req)
        .then(function(response){
                if(response.data.creation.length > 0){
                    $scope.selectedTable.change = 0;
                    $scope.tableCreation = response.data.creation;
                    $scope.tableCreationBackup = angular.copy($scope.tableCreation);
                    console.log($scope.tableForeignKeys);
                    //$scope.tableForeignKeys = response.data.foreign;
                    //$scope.tableForeignKeysBackup = angular.copy($scope.tableForeignKeys);
                    //for(var k=0;k<$scope.tableForeignKeys.length;k++){
                        //$scope.getListofTableColumns($scope.tableForeignKeys[k].reference,k);
                    //}
                    $scope.tableDetailChange = 0;
                }
                $scope.checkError(response.data.error);
              });
            
        
    }
    
//    tableDetailIndexing
    $scope.tableDetailIndexing = function(){
        for(var i =0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].key == ""){
                $scope.tableCreation[i].key="PRI";
                $scope.tableCreation[i].indexing = 1;
                $scope.tableDetailChange = 1;
                return;
            }
        }
    }
    
    //Removing index from the table
    $scope.tableDetailRemoveIndex = function(){
        for(var i =0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].indexSelected == 1){
                
                $scope.tableCreation[i].indexRemoved=1;
                $scope.tableDetailChange = 1;
            }
        }
    }
    
    $scope.checkError = function(error){
        if(error != "")
            alert(error);
    }
    //for up and down button
    $scope.tableItemReposition = function(way){
        var selected = 0;
        for(var i=0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].selected == 1)
                selected = i;
        }
        if(way == 1 && selected!=0 ){
            //up
            var temp = $scope.tableCreation[selected].position;
            $scope.tableCreation[selected].position = $scope.tableCreation[selected-1].position;
            $scope.tableCreation[selected-1].position = temp;

            temp = $scope.tableCreation[selected];
            $scope.tableCreation[selected] = $scope.tableCreation[selected-1];
            $scope.tableCreation[selected-1] = temp;

            //$scope.tableCreation[selected].after = $scope.tableCreation[selected-1].index
//            $scope.tableCreation[selected].change = 1;
            $scope.tableDetailChange = 1;


        }
        else if(way == 0 && selected!=($scope.tableCreation.length-1) ){
            //down
            var temp = $scope.tableCreation[selected].position;
            $scope.tableCreation[selected].position = $scope.tableCreation[selected+1].position;
            $scope.tableCreation[selected+1].position = temp;

            temp = $scope.tableCreation[selected];
            $scope.tableCreation[selected] = $scope.tableCreation[selected+1];
            $scope.tableCreation[selected+1] = temp;

            //$scope.tableCreation[selected].after = $scope.tableCreation[selected-1].index
//            $scope.tableCreation[selected].change = 1;
            $scope.tableDetailChange = 1;
        }
        
        
        
        for(var i=0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].selected == 1)
                selected = i;
        }
        $scope.tableCreation[selected].after = $scope.tableCreation[selected-1].index
        $scope.tableCreation[selected].change = 1;
    }
    //for remove button
    $scope.removeTableItem = function(){
        for(var i=0;i<$scope.tableCreation.length;i++){
            if($scope.tableCreation[i].selected == 1){
                $scope.tableCreation[i].removed = 1;
                $scope.tableDetailChange = 1;
            }
        }
    }
    //For discard button
    $scope.discardTableChange = function(){
        //$scope.tableCreation = tableCreationBackup;
        angular.copy($scope.tableCreationBackup, $scope.tableCreation);
        
        //Reassigning Table column data
        for(var i=0;i<$scope.tableForeignKeys.length;i++){
            
            if($scope.tableForeignKeys[i].change == 1)
                $scope.getListofTableColumns($scope.tableForeignKeysBackup[i].reference,i);
        }
        angular.copy($scope.tableForeignKeysBackup, $scope.tableForeignKeys);
        
        //Changing New table setup
        for(var i=0;i<$scope.database.length;i++){
            if($scope.database[i].name == $scope.dbName)
                dbIndex = i;
        }
        for(var i = 0;i<$scope.database[dbIndex].table.length;i++){
            if($scope.database[dbIndex].table[i].add == 1){
                $scope.database[dbIndex].table.splice(i,1);
                for(var j=0;j<$scope.tabs.length;j++){
                    if($scope.tabs[j].name == 'Table')
                        $scope.tabs.splice(j,2);
                    if($scope.tabs[j].name == 'Database')
                        $scope.tabs[j].active = 1;
                }
            }
        }
        
        
        $scope.tableDetailChange = 0;
    }
    //Dable detial functin end here -----------------------------
    
    $scope.dataChange = function($index){
        //$scope.tableCreation[$index].change = 1;
        $scope.tableDetailChange = 1;
        //console.log($scope.tableCreation);
    }
    
    $scope.addDatabase = function(){
        var dbName = document.getElementById('databaseName').value;
        var req = {
                 method: 'POST',
                 url: base_url,
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: { method:'createDatabase',dbname: dbName}
                }
        $http(req)
        .then(function(response){
                console.log(response);
                $scope.database.push({
                    active:"0",
                    load : "",
                    name : dbName
                });
              }); 
        
    }
    
    //Genneral Calles to get basic data
    $http.get(base_url+'?method=getDatabaseList')
        .then(function(response){
              $scope.database = response.data;

          });
    $http.get(base_url+'?method=getCollationList')
        .then(function(response){
              $scope.collations = response.data;

          });
    $http.get(base_url+'?method=getEngineList')
        .then(function(response){
              $scope.engines = response.data;

          });
}]);

mql.directive('myCheck',function(){
    return {
        restrict:'E',
        scope:{
            "value":"@"
        },
        templateUrl: 'directive/_checkbox.html'
      };
});

mql.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, $rootScope) {
        if ($rootScope.activeCalls == undefined) {
            $rootScope.activeCalls = 0;
        }

        return {
            request: function (config) {
                $rootScope.activeCalls += 1;
                return config;
            },
            requestError: function (rejection) {
                $rootScope.activeCalls -= 1;
                return rejection;
            },
            response: function (response) {
                $rootScope.activeCalls -= 1;
                return response;
            },
            responseError: function (rejection) {
                $rootScope.activeCalls -= 1;
                return rejection;
            }
        };
    });
}]);


mql.directive('loadingSpinner', function ($http) {
    return {
        restrict: 'A',
        replace: true,
        template: '<div id="loader"><div class="loader">Loading</div></div>',
        link: function (scope, element, attrs) {

            scope.$watch('activeCalls', function (newVal, oldVal) {
                if (newVal == 0) {
                    $(element).hide();
                }
                else {
                    $(element).show();
                }
            });
        }
    };
});


var base_url = 'api/api.php';
var database = {
                "name" : "Database",
                "display":"<span class='fa fa-database'></span> Database",
                "view" : "views/_dbDetail.html",
                "active" : 0
            };
var table = {
                "name" : "Table",
                "display" : "<span class='fa fa-table'></span> Table",
                "view" : "views/_tableDetails.html",
                "active" : 0
            };
var tableData = {
                "name" : "TableData",
                "display" : "<span class='fa fa-navicon'></span> Data",
                "view" : "views/_tableData.html",
                "active" : 0
            };
var addTab = {
                "name" : "Plus",
                "display" : "<span class='fa fa-plus'></span>",
                "active" : 0
            };


document.querySelectorAll('.queryTabs').outerHeight = (window.outerHeight-100);
var extScope;
function removeTab(incr){
    //alert('hi');
    
        extScope.$apply(function(){
            
            for(var i=0;i<extScope.tabs.length;i++){
                if(extScope.tabs[i].incr == incr){
                    //extScope.tabs.remove(i);
                    extScope.tabs.splice(i, 1);
                }
            }
            extScope.tabs[extScope.tabs.length-2].active = 1;
            extScope.tabIndex = extScope.tabs[extScope.tabs.length-2].name;
        })
}

function markupTool(obj,key){
    
    var item = $('.queryContent:visible');
    if(item.text() == ""){
        item.html('');
        return;
    }
        
    var text = item.html();
    var word = text.split(' ');
    var keyword = ['select','from','where'];
    var database = extScope.database;
    if(key==32){
        for(var i=0;i<keyword.length;i++){
            text = text.split('<orange>'+keyword[i].toUpperCase()+'</orange>').join(keyword[i]);
            text = text.split(keyword[i]).join('<orange>'+keyword[i].toUpperCase()+'</orange>');
            //case for uppercase
            //text.split((keyword[i].toUpperCase())).join('<orange>'+keyword[i].toUpperCase()+'</orange>');
            
            //console.log(text);
        }
        var activeDB = 0;
        for(var i = 0;i<database.length;i++){
            if(database[i].active == 1)
                activeDB = i;
        }
        if(activeDB != 0){
            var table = database[activeDB].table;
            //console.log(table);
            for(var i=0;i<table.length;i++){
                text = text.split('<blue>'+table[i].name+'</blue>').join(table[i].name);
                text = text.split(table[i].name).join('<blue>'+table[i].name+'</blue>');
                console.log(text);
            }
        }
    }
    
    var pos = $('.queryContent:visible').caret('pos');
    
    //Cleaning content
    $('.queryContent:visible orange,.queryContent:visible blue').each(function(){
        if($(this).is(':empty'))
            $(this).remove();
    });
    
    item.html(text);
    $('.queryContent:visible').caret('pos',pos);
    //console.log(pos);
    
}