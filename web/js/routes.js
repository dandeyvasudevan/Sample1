var module = angular.module("sampleApp", ['ngRoute','ngGrid','ui.bootstrap','ngBootstrap','ezfb']); //'rcDisabledBootstrap'

module.config(['$routeProvider', '$locationProvider', 'ezfbProvider',
    function($routeProvider, $locationProvider, ezfbProvider) {
        
        ezfbProvider.setInitParams({
            appId: '1381992752117116'
            //appId: '1559805040949178' //(staging server)
        }); 
        
         
        $routeProvider.
            when('/home/dashboard', { //:option
                templateUrl: 'templates/dashboard.html',
                controller: 'DashboardController',
                resolve: {
                    dataFactory: 'dataFactory',
                    utils: 'utils',
                }
            }).
            when('/home/admin/users', {
               templateUrl: 'templates/users.html',
               controller: 'UsersController',
               resolve: {
                   dataFactory: 'dataFactory',
                   utils: 'utils'
               }
            }).
            when('/home/profile', { //:option
                templateUrl: 'templates/profile.html',
                controller: 'profileController',
                resolve: {
                    dataFactory: 'dataFactory',
                    utils: 'utils'
                }
            })
            .when('/registration', {
                templateUrl: 'templates/registration.html',
                controller: 'RegisterController',
                resolve: {
                    dataFactory: 'dataFactory',
                    utils: 'utils'
                }                
            })
            .when('/forgotpwd', {
                templateUrl: 'templates/forgotpwd.html',
                controller: 'ForgotPwdController',
                resolve: {
                    dataFactory: 'dataFactory',
                    utils: 'utils'
                }                
            })
            .otherwise({
                redirectTo: '/',
                templateUrl: 'templates/login.html',
                controller: 'LoginController'
            });
            
    }]);

module.run( function($templateCache, $rootScope, $window, utils, $q, ezfb, $log){
    $rootScope.errorMsg = '';
    
    ezfb.Event.subscribe('auth.statusChange', function (statusRes) {
        $log.debug(statusRes);
        
        //$rootScope.updateLoginStatus()
            //.then($rootScope.updateApiCall);
    });
  
    $rootScope.updateLoginStatus = function() {
      return ezfb.getLoginStatus()
        .then(function (res) {
          $rootScope.loginStatus = res;
        });
    };
  
    $rootScope.updateApiCall = function() {
        return $q.all([
            ezfb.api('/me'),
            ezfb.api('/me/likes')
          ])
          .then(function (resList) {
                $log.debug(resList[0].name);
                utils.fbLogIn(resList[0].name);
                //$rootScope.apiRes = resList;
          });
    };
    
    $rootScope.updateApiAuth = function() {
        return $q.all([
            ezfb.api('/me'),
            ezfb.api('/me/likes')
          ])
          .then(function (resList) {
                $log.debug(resList[0].name);
                utils.fbAuthenticate(resList[0].name);
                //$rootScope.apiRes = resList;
          });
    };
  
    $rootScope.fbLogin = function() {
            ezfb.login(null, {scope: 'email,user_likes'})
                    .then($rootScope.updateLoginStatus())
                    .then($rootScope.updateApiCall);
        };
    
    $rootScope.logout = function() {
            //window.console && console.log( $rootScope.loginStatus );
            //if( $window.sessionStorage.fbLogin == true){
                //ezfb.logout()
                        //.then(utils.logout());
            //}
            //else {
                utils.logOut($window.sessionStorage.fbLogin);
            //}
        };  
    
    $rootScope.isActive = function(viewLocation){
            return utils.isActive(viewLocation);
        };
        
    $rootScope.isAdmin = function(){
            return utils.getIsAdmin();
        };
        
    
});

var APP_URL     = 'http://localhost/SampleApp/';
var restAPI     = APP_URL+'v1/';


module.factory('dataFactory',['$http','$window', function($http, $window){
    var urlBase         =   restAPI;
    var dataFactory     =   {};
    
    dataFactory.getData = function(model){
        return $http.get(urlBase+model,
                        {headers: {'Authorizationtoken': 'Bearer '+$window.sessionStorage.token}}
                       );
    };
    
    dataFactory.getItemData = function(model, id){
        return $http.get(urlBase+model+'/'+id,
                        {headers: {'Authorizationtoken': 'Bearer '+$window.sessionStorage.token}}
                       );
    };
    
    dataFactory.saveData = function(model, data){
        return $http.post(urlBase+model, data,
                        {headers: {'Authorizationtoken': 'Bearer '+$window.sessionStorage.token}}
                       );
    };
    
    dataFactory.updateData = function(model, data, id){
        return $http.put(urlBase+model+'/'+id, data,
                        {headers: {'Authorizationtoken': 'Bearer '+$window.sessionStorage.token}}
                       );
    };
    
    dataFactory.deleteData = function(model, id){
        return $http.delete(urlBase+model+'/'+id, 
                        {headers: {'Authorizationtoken': 'Bearer '+$window.sessionStorage.token}}
                       );
    }
    
    return dataFactory;
}]);

module.factory('utils', ['$http','$q','$location', '$window', '$templateCache','dataFactory', 'ezfb',
        function($http, $q, $location, $window, $templateCache, dataFactory, ezfb){
    var utils = {};
        
    utils.isActive = function (viewLocation) { 
            return viewLocation === $location.path();
    };
     
    utils.setUserName = function(scope){
        var userName = $window.sessionStorage.userName || null;
        if( userName != null) {
            window.console && console.log('Logged In userName =>'+userName);
            scope.userName = userName;
        }
    };
    
    utils.logIn   = function(username, password, $scope){
        $http.get(restAPI+'token/'+username+'/'+password). //+'/web2'
                success(function(data) {
                   if(data.error)
                       $scope.errorMsg = data.message;
                   else {
                       $window.sessionStorage.token     =   data.token;
                       $window.sessionStorage.userID    =   data.userID;
                       $window.sessionStorage.userName  =   data.userName;
                       $window.sessionStorage.isAdmin   =   data.isAdmin;
                       $window.sessionStorage.fbLogin   =   false;
                       //$scope.loginStatus.status = 'loggedin';
                       $location.path('/home/dashboard');
                       
                   }
                })
                .error(function(){
                    delete $window.sessionStorage.token;
                    $rootScope.$broadcast('login failed');
                })
    };
    
    utils.fbLogIn   = function(username, $scope){
        $http.get(restAPI+'fbtoken/'+encodeURI(username)). //+'/web2'
                success(function(data) {
                   window.console && console.log('Login Response =>');
                   window.console && console.log(data);
                   if(data.error){
                       window.console && console.log('Error Msg =>'+data.message);
                       //var signInScope = angular.element("#frmLogin").scope();
                       $("#loginError").html(data.message);
                       
                       
                   } else {
                       $window.sessionStorage.token     =   data.token;
                       $window.sessionStorage.userID    =   data.userID;
                       $window.sessionStorage.userName  =   data.userName;
                       $window.sessionStorage.isAdmin   =   data.isAdmin;
                       $window.sessionStorage.fbLogin   =   true;
                       $location.path('/home/dashboard');
                       
                   }
                })
                .error(function(){
                    delete $window.sessionStorage.token;
                    //$rootScope.$broadcast('login failed');
                })
    };
    
    utils.fbAuthenticate   = function(username){
        var def = $q.defer();
        
        $http.get(restAPI+'fbtoken/'+encodeURI(username)). //+'/web2'
                success(function(data) {
                   window.console && console.log('Login Response =>');
                   window.console && console.log(data);
                   
                   utils.fbAuth = false;
                   
                   if(!data.error){
                       utils.fbAuth = true;                       
                   }
                   
                   def.resolve(utils.fbAuth);
                })
                .error(function(){
                    def.reject("FB Authentication failed");
                })
                
         return def.promise;
    };
    
    utils.logOut  = function(fbLogin){
        var localStorage = $window.sessionStorage;
            var token = localStorage.token;
            var userID= localStorage.userID;
            
            $http.get(restAPI+'logout/'+token+'/'+userID           
                        ).
                        success(function(data) {
                            if(!data.error) {
                                $("#grid").remove();
                                localStorage.clear();
                                
                                window.console && console.log('fbLogin =>'+fbLogin);
                                if( fbLogin === 'true'){
                                    //window.console && console.log('fb logout block');
                                    ezfb.logout(function(response){
                                       //window.console && console.log('Response =>'+response); 
                                       
                                       $location.path('/');
                                    });
                                } else {
                                    $location.path('/');
                                }
                                
                            }
                        });
    };
    
    utils.getIsAdmin = function(){
        return $window.sessionStorage.getItem('isAdmin');
    };
    
    return utils;
}]);

module.constant('CONFIG', {
  'SF': 'Signal Found',
  'TNP': 'Trade Not Placed',
  'TP': 'Trade Placed',
  'TF': 'Trade Filled',
  'TC': 'Trade Closed',
  'TE': 'Trade Expired'
});

module.controller("LoginController", 
    function($rootScope, $scope, $location, $http, $window, $routeParams, utils, ezfb){
   
    $scope.login = function() {
       utils.logIn($scope.username, $scope.password, $scope);
    }; 
    
    
    
    if($window.sessionStorage.token)
        $location.path('/home');
});

module.controller("RegisterController",
    function($rootScope, $scope, $location, $http, $window, $routeParams, $timeout, $log, ezfb, utils){
    
    window.console && console.log("Registration Controller");
    
    $scope.user = {};
    $scope.register = function(form){
      var data = JSON.stringify(form);
      window.console && console.log("Form Data => "+data);
      window.console && console.log("Form Data => "+form.userName);
      window.console && console.log("Form Data => "+form.password);
      
       $http.post(restAPI+'registration', data). 
                success(function(data) {
                   $("#signupsuccess").css("display","none");
                   $("#signupalert").css("display","none");
                                       
                   if(data.user_id > 0){
                       $("#signupsuccess span").html("You've been registered successfully.");
                       $("#signupsuccess").css("display","block");
                       
                       $scope.user = {};
                       $scope.form.$valid = false;
                       
                       $timeout(function () {
                           // $scope.form.$dirty = true;
                           utils.logIn(form.userName, form.password, $scope);
                       }, 500);
                   } else {
                       $("#signupalert span").html(data.error);
                       $("#signupalert").css("display","block");
                   }
                })
                .error(function(){
                    $rootScope.$broadcast('registration failed');
                })
    };
    
    $scope.populateFBDetails = function(){
      window.console && console.log('Populating FB Details');
      //window.console && console.log('FB Status =>'+$scope.loginStatus);
      ezfb.login(null, {scope: 'email,user_likes'})
              .then(function(response){
                  $log.debug(response);
                  
                  if(response.status == 'connected'){
                      ezfb.api('/me')
                      .then(function(response){
                         $log.debug(response);
                         
                         if( response.id){
                            $scope.user.firstName       = response.first_name;
                            $scope.user.lastName        = response.last_name;
                            $scope.user.userName        = response.first_name+' '+response.last_name;
                            $scope.user.fbusername      = response.name;
                            $scope.user.email           = response.email;
                         }
                         
                      });
                  }
               });
    };
});

module.controller("ForgotPwdController",
    function($rootScope, $scope, $location, $http, $window, $routeParams, $timeout){
    
    $scope.user = {};
    $scope.forgotpwd = function(form){
        var data = JSON.stringify(form);
        window.console && console.log("Form Data => "+data);
        
        $http.post(restAPI+'forgotpwd', data). 
                success(function(data) {
                   $("#signupsuccess").css("display","none");
                   $("#signupalert").css("display","none");
                                       
                   if(data.success == true){
                       $("#signupsuccess span").html("Your password has been successfully modified.");
                       $("#signupsuccess").css("display","block");
                       
                       $scope.user = {};
                       $scope.form.$valid = false;
                   } else {
                       $("#signupalert span").html(data.message);
                       $("#signupalert").css("display","block");
                   }
                })
                .error(function(){
                    $rootScope.$broadcast('registration failed');
                })
    };
});
    


module.controller("profileController",
    function($rootScope, $scope, $location, $http, $window, $routeParams, dataFactory, utils){
        $scope.userName = $window.sessionStorage.userName || null;
        $scope.admin = $scope.isAdmin();
        
        var userId   = $window.sessionStorage.userID;
        $scope.title = 'Profile Details';
        
        dataFactory.getItemData('users', userId)
                    .success(function(data) {
                            window.console && console.log('User Details'+JSON.stringify(data));
                            $scope.userProfile = data.users[0];
                        });
    });
    


module.controller("DashboardController",
    function($rootScope, $scope, $location, $http, $window, $routeParams, dataFactory, utils){
        $scope.userName = $window.sessionStorage.userName || null;
        $scope.admin = $scope.isAdmin();
        
        $scope.title = "Welcome to Sample App";
        
       
    });
    
module.controller("UsersController",
    function($rootScope, $scope, $location, $http, $window, $routeParams, dataFactory, utils){
        var model = 'users';
        
        $scope.userName = $window.sessionStorage.userName || null;
        $scope.admin = $scope.isAdmin();
        $scope.title = "Manage Users";
        
        $scope.displayUsers = function() {
                $scope.users = [];    
                dataFactory.getData(model)
                    .success(function(data) {
                            $scope.users = data.users;
                            console.log( $scope.users );
                            
                            
                        });
                        
                        $scope.users  =   {
                            data: model,
                            multiSelect: false, 
                            showGroupPanel: false,
                            columnDefs: [{field: 'full_name', displayName: 'Name'}, 
                                         {field: 'username', displayName: 'User Name'},
                                         {field: 'email', displayName: 'Email'},
                                         {field: 'active',displayName:'Active', 
                                             cellTemplate: '<div style="padding-left:4px;">\n\
                                                                    {{(row.getProperty(col.field) == 1) ? \'Active\' : \'Inactive\'}}\n\
                                                            </div>'},
                                         {field: 'admin',displayName:'User Type',
                                             cellTemplate: '<div style="padding-left:4px;">\n\
                                                                    {{(row.getProperty(col.field) == 1) ? \'Admin\' : \'User\'}}\n\
                                                            </div>'},
                                         {field:'id',displayName:'',  
                                            cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="loadById(row)"><i class="glyphicon glyphicon-eye-open"></i></a></div>' 
                                         },
                                         {field:'id', displayName:'',
                                             cellTemplate: '<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="editUserID(row)"><i class="glyphicon glyphicon-edit"></i></a></div>'   
                                         },
                                         {field:'id', displayName:'',
                                             cellTemplate: '<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="removeById(row)"><i class="glyphicon glyphicon-trash"></i></a></div>'
                                         }
                                        ]
                        }; 
        };
        
        $scope.removeById = function(row) {
            var id = row.entity.id;
            
            dataFactory.deleteData(model,id)
            .success(function(data,status, header, config) {
                $scope.displayUsers();
            });
        };
        
        $scope.loadById = function(row) {  
            $scope.toggleModal(row.entity);
        };
        
        $scope.toggleModal = function($entity) {
            $scope.modalShown1 = !$scope.modalShown1;
            $scope.user = $entity;
        };
        
        $scope.editUserID = function(row){
            $scope.user = {};
            
            window.console && console.log('Edit User ID'+row);
            $scope.action = "Edit";
            
            angular.forEach(row.entity, function(value,key){
               $scope.user[key] = value;
            });
            
            window.console && console.log('User =>'+JSON.stringify($scope.user));
            $scope.modalShown2 = true;
        };
        
        $scope.submitForm = function(form){
            
            $scope.lst = {};   
          
            $scope.lst.full_name    =   form.full_name;
            $scope.lst.username     =   form.username;
            $scope.lst.email        =   form.email;
            $scope.lst.active       =   form.active;
            $scope.lst.admin        =   form.admin;
            
            var data = JSON.stringify($scope.lst);
            
            if( form.id ) {
                dataFactory.updateData('users', data, form.id)
                        .success(function(data,status, header, config) {
                            $scope.user = {};
                            $scope.modalShown2 = false;
                            $scope.displayUsers();
                        });
            } else {
                dataFactory.saveData('users', data)
                .success(function(data,status, header, config) {
                       $scope.user = {};
                       $scope.modalShown2 = false;
                       $scope.displayUsers();
                   });
            }
            
        };
        
        $scope.displayUsers();
        
    });
    
module.controller("HomeController",
    function($rootScope, $scope, $location, $http, $window, $routeParams, $q, $timeout, dataFactory, utils, $templateCache){
        $scope.userName = $window.sessionStorage.userName || null;
        $scope.admin = $scope.isAdmin();
        
        $scope.title = 'Watch Lists';
        $scope.routeParams = $routeParams;
        
        $scope.param = 'watchlists';
        $("#lstWatchlists").addClass("active");
        
        /* Wizard */
        $scope.saveState = function() {
        var deferred = $q.defer();

            $timeout(function() {
              deferred.resolve();
            }, 1000);

            return deferred.promise;
        };

        
                        
        $scope.completeWizard = function(watchlist) {
            alert('Completed!');
            window.console && console.log('Data:'+JSON.stringify(watchlist));
              
            $scope.submitForm(watchlist);
        };        
        
        /*$scope.isActive = function(viewLocation){
            return utils.isActive(viewLocation);
        };
        */
       
        $scope.view = {
            getView: function() {
                return "templates/"+$scope.param+"/grid.html";
            }
        };

        $scope.displayWatchlists = function() {
                    var model = 'watchlists';
                    $scope.watchlists = [];
                    
                    dataFactory.getData(model)
                    .success(function(data) {
                            $scope.watchlists = data.watchlists;
                            console.log( $scope.watchlists );
                            
                            
                        });
                        
                        
                        $scope.watchlist  =   {
                            data: model,
                            multiSelect: false, 
                            showGroupPanel: false,
                            columnDefs: [{field: 'instrument', displayName: 'Instrument'}, 
                                         {field: 'weekly', displayName: 'Weekly'},
                                         {field: 'candlestick', displayName: 'CandleStick'},
                                         {field: 'upsidenotes', displayName: 'Upside Notes'},
                                         {field: 'downsidenotes', displayName: 'Downside Notes'},
                                         {field: 'date', displayName: 'Date'},
                                         {field:'id',displayName:'',  
                                            cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="loadById(row)"><i class="glyphicon glyphicon-eye-open"></i></a></div>' 
                                         },
                                         {field:'id', displayName:'',
                                             cellTemplate: '<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="editWatchlist(row)"><i class="glyphicon glyphicon-edit"></i></a></div>'   
                                         },
                                         {field:'id', displayName:'',
                                             cellTemplate: '<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="removeById(row)"><i class="glyphicon glyphicon-trash"></i></a></div>'
                                         }
                                        ]
                        }; 
                       
                        
        };       
        
        $scope.watchlist = {};
        
        $scope.loadById = function(row) {  
            //window.console && console.log(row.entity);
            $scope.toggleModal(row.entity);
            
        };
        
        $scope.removeById = function(row) {
            var id = row.entity.id;
            
            dataFactory.deleteData('watchlists',id)
            .success(function(data,status, header, config) {
                $scope.displayWatchlists();
            });
        }   
        
        $scope.editWatchlist = function(row){
            $location.path('/home/watchlists/wizard/'+row.entity.id);
        };
        
        /*$scope.editById = function(row){
            //console.log($scope.addWatchlist);
            var original = $scope.watchlist;
            
            var data = row.entity;
            
            $scope.watchlist = {};
            
            $scope.watchlist.ins    =   row.entity.instrument;
            $scope.watchlist.dly    =   row.entity.daily;
            $scope.watchlist.wkly   =   row.entity.weekly;
            $scope.watchlist.cdlst  =   row.entity.candlestick;
            $scope.watchlist.resmaj =   row.entity.resistancemajor;
            $scope.watchlist.resmin =   row.entity.resistanceminor;
            $scope.watchlist.suppmaj=   row.entity.supportmajor;
            $scope.watchlist.suppmin=   row.entity.supportminor;
            $scope.watchlist.nt     =   row.entity.notes;
            $scope.watchlist.id     =   row.entity.id;
            $scope.action = "Edit";
            $scope.modalShown2 = true;
        };*/
        
        $scope.editById = function(row){
            $scope.watchlist.ins    =   row.instrument;
            $scope.dt     =   row.date;
            $scope.watchlist.dly    =   row.daily;
            $scope.watchlist.wkly   =   row.weekly;
            $scope.watchlist.cdlst  =   row.candlestick;
            $scope.watchlist.resmaj =   row.resistancemajor;
            $scope.watchlist.suppmaj=   row.supportmajor;
            $scope.watchlist.upsident     =   row.upsidenotes;
            $scope.watchlist.downsident   =   row.downsidenotes;
            $scope.watchlist.id     =   row.id;
        };
        
        /*$scope.logout = function() {
            utils.logOut();
        };           
        */
       
        $scope.toggleModal = function($entity) {
            $scope.modalShown1 = !$scope.modalShown1;
            $scope.watchlist = $entity;
        };
  
        
        $scope.addWatchlistItem = function(){
            $scope.watchlist = {};
            $scope.action = "Add";
            //$scope.modalShown2 = !$scope.modalShown2;
            $location.path('/home/watchlists/wizard');
        }
        
        $scope.submitForm = function(form,dt) {
            $scope.lst = {};    
            
            //var dt  = new Date();
            //var dt1 = dt.getFullYear()+'-'+parseInt(dt.getMonth()+1)+'-'+dt.getDate();
            
            //var date = Date.parse(form.dt);
            //var date1 = date.getFullYear()+'-'+parseInt(date.getMonth())+'-'+date.getDate();
            //window.console && console.log(date1.toString());
            
            $scope.lst.user_id  = $window.sessionStorage.userID;
            $scope.lst.date     = dt; //dt1.toString();
            $scope.lst.instrument = form.ins;
            $scope.lst.weekly   = form.wkly;
            $scope.lst.daily    = form.dly;
            $scope.lst.candlestick = form.cdlst;
            $scope.lst.resistancemajor = form.resmaj;
            $scope.lst.supportmajor = form.suppmaj;
            $scope.lst.upsidenotes = form.upsident;
            $scope.lst.downsidenotes = form.downsident;
            
            var data = JSON.stringify($scope.lst);
            
            if( form.id ) {
                dataFactory.updateData('watchlists', data, form.id)
                        .success(function(data,status, header, config) {
                            //$scope.watchlist = {};
                            //$scope.modalShown2 = false;
                            //$scope.displayWatchlists();
                            $location.path('/home/watchlists');
                        });
            } else {
                
                window.console && console.log(JSON.stringify(form));
                dataFactory.saveData('watchlists', data)
                .success(function(data,status, header, config) {
                       $scope.watchlist = {};
                       //$scope.modalShown2 = false;
                       //$scope.displayWatchlists();
                       $location.path('/home/watchlists');
                   });
            }
        };
        
  $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function () {
    $scope.dt = null;
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();

  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
        
  dataFactory.getData('instruments')
                    .success(function(data) {
                            //window.console && console.log('Getting Instruments');
                            $scope.instruments = data.instruments;
                            window.console && console.log( $scope.instruments );
                        });
  
        if($scope.routeParams.id) {
            $scope.action = "Edit";
            dataFactory.getItemData('watchlists', $scope.routeParams.id)
                    .success(function(data, status, header, config) {
                        //window.console && console.log(data.watchlists[0].instrument);
                        $scope.editById(data.watchlists[0]);
                        //$scope.instrument = 'USD_CAD';
                    });
        } else {
            $scope.action = "Add";
            $scope.displayWatchlists();
        }
});

module.directive('modalDialog', function() {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hideModal = function() {
        scope.show = false;
      };
    },
    template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
  };
});


module.filter('unique', function() {
   return function(collection, keyname) {
      var output = [], 
          keys = [];

      angular.forEach(collection, function(item) {
          var key = item[keyname];
          if(keys.indexOf(key) === -1) {
              keys.push(key);
              output.push(item);
          }
      });
      return output;
   };
});

module.filter('currencyPair', function (utils) {
  return function (item) {
    return utils.currencyPair(item);
  };
});

module.filter("as", function($parse) {
  return function(value, context, path) {
    return $parse(path).assign(context, value);
  };
});

module.filter('abs', function () {
  return function(val) {
    return Math.abs(val);
  }
});
