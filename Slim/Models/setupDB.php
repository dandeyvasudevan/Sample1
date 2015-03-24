<?php

$database   =   $config['database'];
$dbHost     =   $database['host'];
$dbUserName =   $database['username'];
$dbPassword =   $database['password'];
$dbName     =   $database['name'];

//Set up database connection
R::setup('mysql:host='.$dbHost.';dbname='.$dbName.';',$dbUserName,$dbPassword);
R::freeze(true);
