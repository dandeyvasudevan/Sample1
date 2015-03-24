<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


class OAuth2 {
        
    //Logic to check if token is valid or not..
    public static function isValidAccessToken($token){
        $accessTokenRows    =   R::getRow('select * from oauth_access_tokens where access_token="'.$token.'"');
        
        return ($accessTokenRows) ? true : false;
    }
    
    //Logic to add response and exit from app..
    public static function echoResponse($status_code, $response){
        $app    =   Slim\Slim::getInstance();
        $app->status($status_code);
        
        $app->contentType('application/json');
        echo json_encode($response);
    }
    
    //Logic to check if token exists in header
    public static function getToken(){
        $headers    =   apache_request_headers();
         $header     =   isset( $headers['Authorizationtoken'] ) ? $headers['Authorizationtoken'] : '';
        $accessToken=   trim(preg_replace('/^(?:\s+)?Bearer\s/', '', $header));
        
        return $accessToken;
    }
    
    public static function getUserID(){
        $token  =   self::getToken();
        
        $query  =   "SELECT * 
                    FROM  `oauth_access_tokens` oat,  `users` u
                    WHERE oat.user_id = u.id
                    AND oat.access_token='".$token."'";
        
        $loginData  =   R::getRow($query);
        $userID     =   $loginData['user_id'];
        
        return $userID;
    }
    
    public static  function checkUserExists($userName){
        $query  =   "select * from users where username='".$userName."'";
        $results    =   R::getAll($query);
        $resultsCnt =   count($results);
        
        return $resultsCnt;
    }
    
    public static function checkFbUserNameExists($fbUserName){
        $query  =   "select * from users where fbusername='".$fbUserName."'";
        $results    =   R::getAll($query);
        $resultsCnt =   count($results);
        
        return $resultsCnt;
    }
    
    public static function getWorkFlowIns($userID, $date){
        $query  =   "SELECT ins.id, ins.instrument, ins.displayname, ins.tickvalue, wt.date, wt.user_id, 
                    (CASE WHEN IFNULL(wt.id,0) THEN 1 ELSE 0 END) as cond
                    FROM  `instruments` ins
                    LEFT JOIN watchlists wt ON wt.instrument = ins.displayname AND wt.user_id=".$userID."
                    AND wt.date =  '".$date."' AND wt.user_id=".$userID." WHERE ins.active=1 
                    ORDER BY ins.sortorder ASC";
        $results    =   R::getAll($query);
        $resultsCnt =   count($results);
        
        //echo '<br />Results Cnt:'.$resultsCnt;
        //print_r( $results );
        
        $arrWFIns   =   array();
        if( $resultsCnt > 0){
            for($i=0; $i<$resultsCnt; $i++){
                $row                    =   $results[$i];
                $instrumentID           =   $row['id'];
                $instrumentName         =   $row['instrument'];
                $instrumentTickValue    =   $row['tickvalue'];
                $displayName            =   $row['displayname'];
                $cond                   =   $row['cond'];
                
                if( $cond == 0) {
                    $arrWFIns[] =  array("insID"=>$instrumentID,
                                    "insName"=>$instrumentName,
                                    "tickvalue"=>$instrumentTickValue,
                                    "displayName"=>$displayName
                                    );   
                }
                
            }
        }
        
        return $arrWFIns;
    }
    
    //Logic to generate api token key..
    public static function generateToken() {
        //return substr( md5(uniqid(rand(), true)), 0, 16);
        return bin2hex(openssl_random_pseudo_bytes(8));
    }
    
    public static function generateAccessSecretToken(){
        return bin2hex(openssl_random_pseudo_bytes(16));
    }
    
    public static function generateConsumerKey(){
        return substr(uniqid(),0,4);
    }
    
    public static function generateConsumerSecretKey(){
        return bin2hex(openssl_random_pseudo_bytes(10));
    }
    
    public static function determineAccessTokenInHeader(Slim\Http\Request $request)
    {
        //$header     =   $request->headers('Authorization');
        $headers    =   apache_request_headers(); 
        $header     =   isset( $headers['Authorizationtoken'] ) ? $headers['Authorizationtoken'] : '';
        $accessToken=   trim(preg_replace('/^(?:\s+)?Bearer\s/', '', $header));

        return ($accessToken === 'Bearer') ? '' : $accessToken;
    }
    
    public static function checkLogin($userName, $password, $consumerKey = '', $fbUserName = ''){
        if( $userName != '' && $password != '') {
            $query  =   "SELECT * 
                        FROM  `oauth_consumers` oc,  `users` u
                        WHERE oc.user_id = u.id
                        AND u.username =  '".$userName."'
                        AND u.password =  '".md5($password)."'";
        } else if($fbUserName != '') {
            $query  =   "SELECT * 
                        FROM  `oauth_consumers` oc,  `users` u
                        WHERE oc.user_id = u.id
                        AND u.fbusername =  '".$fbUserName."'";
        }
            
        if( $consumerKey != "")
          $query    .=  " AND oc.consumer_key = '".$consumerKey."'";
        
          $query    .=  " AND oc.enable_password_grant=1 AND u.active=1";
        
        
        //echo $query;
        $loginData  =   R::getRow($query);
        $response   =   array();
        
        if( $loginData ){
            $access_token           =   self::generateToken();
            $access_secret_token    =   self::generateAccessSecretToken();
            $userID                 =   $loginData['user_id'];
            $isAdmin                =   $loginData['admin'];
            
            $sql = 'insert into oauth_access_tokens set '
            . 'access_token = :access_token,' 
            . 'access_token_secret = :access_token_secret,'
            . 'consumer_key = :consumer_key, '
            . 'user_id = :user_id';
            
            try {
                $update =   R::exec($sql, array("access_token"=>$access_token, 
                                                "access_token_secret"=>$access_secret_token,
                                                "consumer_key"=>$consumerKey,
                                                "user_id"=>$userID
                                        ));
                
                $response["token"]      =   $access_token;
                $response["userID"]     =   $userID;
                $response["userName"]   =   $loginData['username'];
                $response["isAdmin"]    =   $isAdmin;
            } catch (PDOException $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
            
        } else {
            $response["error"]  =   true;
            $response["message"]=   "Authentication Failed.";
        }
     
        return $response;
    }
    
    public static function changePwd($userName, $password){
        $userExists =   self::checkUserExists($userName);
        
        if( $userExists > 0) {
           $sql =  'update users set '
                   .'password = \''.md5($password).'\'' 
                   .'where username = \''.$userName.'\'';
        
             try {
                $update =   R::exec($sql);
                
                $response["success"]    =   true;
            } catch (PDOException $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            } 
        } else {
            $response["error"]    =   true;
            $response["message"]  =   'UserName doesn\'t exists';  
        }
        
        return $response;
    }
    
    public static function logout($access_token, $userID){
        if( $access_token ){
            $sql = 'DELETE FROM oauth_access_tokens WHERE access_token = :access_token AND user_id = :userID';
            
            try {
                $delete =   R::exec($sql, array("access_token"=>$access_token,
                                                "userID"=>$userID
                                                ));
                
                $response["message"]    =   true;
                $response["error"]      =   false;
            } catch (PDOException $e) {
                $app->response()->status(400);
                $app->response()->header('X-Status-Reason', $e->getMessage());
            }
        } else {
            $response["error"]  =   true;
        }
        
        return $response;
    }
}

