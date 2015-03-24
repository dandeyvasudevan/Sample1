<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With');
header('Access-Control-Allow-Credentials: true');

require 'Slim/Slim.php';
require 'RedBean/rb.php';

$config = require 'config/params.php';
require_once 'Slim/Models/OAuth2.php';

\Slim\Slim::registerAutoloader();

include_once 'Slim/Models/setupDB.php';

class ResourceNotFoundException extends Exception {}

$version    =   "v1";
$app        =   new \Slim\Slim();
//$app->add(new Slim\Middleware\HttpBasicAuth("vasudevan", "dandey"));

function checkAccess($accessToken){
    $accessTokenRows    =   R::getRow('select * from oauth_access_tokens where access_token="'.$accessToken.'"');
    $accessTokenRowsCnt =   count($accessTokenRows);
    
    if( $accessTokenRowsCnt == 0) {
        $data['token']  =   null;
            
        echo json_encode($data);
        exit;
    }
    
    return true;
}

/**
 * Function to authenticate every request
 * Logic to check if the request has valid authorization header
 */
function authenticate(Slim\Route $route){
    
    
    $app        =   Slim\Slim::getInstance();
    
    $response   =   array();
    $request    =   $app->request();
    $headers    =   OAuth2::determineAccessTokenInHeader($request);
    
    
    if( isset($headers)){
        $token      =   $headers;
        
        if( !OAuth2::isValidAccessToken($token)){
            $response["error"]  =   true;
            $response["message"]=   "Access Denied. Invalid Token.";
            
            OAuth2::echoResponse(401, $response);
            $app->stop();
        } else {
            $response["token"]  =   $token;
        }
    } else {
        $response["error"] = true;
        $response["message"] = "Api key is misssing";
        
        OAuth2::echoResponse(400, $response);
        $app->stop();
    }
}


$app->get(
    '/',
    function () {
        $template = <<<EOT
<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8"/>
            <title>EApps Tech</title>
            
        </head>
        <body>
            
            <h1>EApps Tech</h1>
            
        </body>
    </html>
EOT;
        echo $template;
    }
);

$app->get(
        '/'.$version.'/helloworld', 
        function() use ($app){
    
            $app->response()->header('Content-Type', 'application/json');
            echo json_encode(array("name"=>"Hello World"));
        }
);

//Logic to generate token - token api
$app->get(
        '/'.$version.'/fbtoken/:fbUserName',
        function($fbUserName) use ($app) {
            $response   =   OAuth2::checkLogin('','','',$fbUserName);
            
            echo json_encode($response);
        }
);

//Listing all model data - eg: watchlists
$app->get(
        '/'.$version.'/:model',
        'authenticate',
        function($model) use ($app){
            $userID     =   OAuth2::getUserID();
            
            if( $model == "watchlists" || $model == "trades") {
                $modelData  =   R::find($model, 'user_id=?', array($userID));
            } else {
                $modelData  =   R::find($model);
            }
            $request    =   $app->request();
            //$request->headers('Access-Control-Allow-Headers','Authorization,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type');    
             
            $app->response()->header('Content-Type', 'application/json');
            
            $data[$model]   =   R::exportAll($modelData);
            $data['token']  =   OAuth2::getToken();
            //$data['token1'] =   OAuth2::generateToken();
            
            echo json_encode($data);
        }
);


//Listing a model data - eg: watchlist/1
$app->get(
        '/'.$version.'/:model/:id',
        'authenticate',
        function($model, $id) use ($app){
            try {
                $modelData    =   R::findOne($model, 'id=?', array($id));
                
                if($modelData){
                    $app->response()->header('Content-Type', 'application/json');
                    
                    $data[$model]   =   R::exportAll($modelData);
                    $data['token']  =   OAuth2::getToken();
                    
                    echo json_encode($data);
                } else {
                    throw new ResourceNotFoundException();
                }
            } catch(ResourceNotFoundException $e) {
                $app->response()->status(404);
            } catch (Exception $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
        }
);

//API to handle user registration
$app->post(
        '/'.$version.'/registration',
        function() use ($app){
            try{
                $request = $app->request();
                $body    = $request->getBody();
                
                $inputData      =   json_decode($body);
                $inputDataCnt   =   count($inputData);
                
                $userName   =   (string)$inputData->userName;
                $userExists =   OAuth2::checkUserExists($userName);
                
                $fbUserName   =   (string)$inputData->fbusername;
                $fbUserExists =   OAuth2::checkFbUserNameExists($fbUserName);
                
                if( $userExists == 0 && $fbUserExists == 0) {
                    //Insert into users table
                    $users = R::dispense('users');
                    $users->username    = $userName;
                    $users->password    = md5((string)$inputData->password);
                    $users->email       = (string)$inputData->email;
                    $users->admin       = 0;
                    $users->active      = 1;
                    $users->full_name   = (string)$inputData->firstName.' '.(string)$inputData->lastName;
                    $users->fbusername  = (string)$inputData->fbusername;
                    $userID             = R::store($users);

                    //Insert into oauth_consumers table
                    if( $userID >0){
                        R::setStrictTyping(false);
                        $oauthConsumer = R::dispense('oauth_consumers');
                        $oauthConsumer->consumer_key            = OAuth2::generateConsumerKey();
                        $oauthConsumer->consumer_secret         = OAuth2::generateConsumerSecretKey();
                        $oauthConsumer->user_id                 = $userID;
                        $oauthConsumer->enable_password_grant   = 1;

                        $oauthID    = R::store($oauthConsumer);
                    }

                    $app->response()->status(201);
                    $app->response()->header('Content-Type', 'application/json');

                    $data['user_id']  =   $userID;
                } else {
                    $data['error']    =   'UserName/FB UserName already exists.';
                }
                
                echo json_encode($data);
                //echo 'registration api';
            } catch (Exception $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
        }
);
   
//Logic to change password
$app->post(
        '/'.$version.'/forgotpwd',
        function() use ($app){
    
        try{
                $request = $app->request();
                $body    = $request->getBody();
                
                $inputData      =   json_decode($body);
                $inputDataCnt   =   count($inputData);
                
                $userName   =   (string)$inputData->userName;
                $password   =   (string)$inputData->password;
                $response   =   OAuth2::changePwd($userName, $password);
                
                echo json_encode($response);
        } catch (Exception $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
        }
                
});

//Logic to handle post requests to /watchlist
$app->post(
        '/'.$version.'/:model',
        'authenticate',
        function($model) use ($app){
            try{
                $request        =   $app->request();
                $body           =   $request->getBody();
                
                $inputData      =   json_decode($body);
                $inputDataCnt   =   count($inputData);
                
                //Saving watchlist information
                $modelData  =   R::dispense($model);
                    
                if($inputDataCnt >0){
                    foreach($inputData as $key=>$val)
                        $modelData->$key    =   $val;
                }
                
                $id =   R::store($modelData);
                
                $app->response()->status(201);
                $app->response()->header('Content-Type', 'application/json');
                
                $data[$model]   =   R::exportAll($modelData);
                $data['token']  =   OAuth2::getToken();
                echo json_encode($data);
                
            } catch (Exception $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
        }
);

//Logic to handle modify model item - put watclist item
$app->put(
        '/'.$version.'/:model/:id',
        'authenticate',
        function($model, $id) use ($app){
            try{
                $request        =   $app->request();
                $body           =   $request->getBody();
                
                $inputData      = json_decode($body);
                $inputDataCnt   =   count($inputData);
                //Saving watchlist information
                $modelData  =   R::load($model, $id);
                
                if($inputDataCnt >0){
                    foreach($inputData as $key=>$val)
                        $modelData->$key    =   $val;
                }
                
                $id =   R::store($modelData);
                
                $app->response()->status(200);
                $app->response()->header('Content-Type', 'application/json');
                
                $data[$model]   =   R::exportAll($modelData);
                $data['token']  =   OAuth2::getToken();
                echo json_encode($data);
                
            } catch (Exception $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
        }
);

//Logic to handle delete model item - delete watchlist/1
$app->delete(
        '/'.$version.'/:model/:id',
        'authenticate',
        function($model, $id) use ($app) {
            try {
                $modelData  =   R::load($model, $id);
                
                if( $modelData) {
                    $delModelData   =   R::trash($modelData);
                    $app->response()->status(200);
                } else {
                    $app->notFound();
                }
                
            } catch (Exception $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
        }
);

//Logic to generate token - token api
$app->get(
        '/'.$version.'/token/:userName/:password',
        function($userName, $password) use ($app) {
            //echo '<br />userName:'.$userName.', password:'.$password.', consumerKey:'.$consumerKey;
            $response   =   OAuth2::checkLogin($userName, $password);
            
            OAuth2::echoResponse(200, $response);
        }
);

$app->get(
        '/'.$version.'/token/:userName/:password/:consumerKey',
        function($userName, $password, $consumerKey) use ($app) {
            //echo '<br />userName:'.$userName.', password:'.$password.', consumerKey:'.$consumerKey;
            $response   =   OAuth2::checkLogin($userName, $password, $consumerKey);
            
            OAuth2::echoResponse(200, $response);
        }
);



//Logic to logout the user
$app->get(
        '/'.$version.'/logout/:token/:userID',
        function($token, $userID) use ($app) {
            $response   =   OAuth2::logout($token, $userID);
            OAuth2::echoResponse(200, $response);
        }
);

$app->run();