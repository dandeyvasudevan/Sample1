<?php
$dsn = 'mysql:host=localhost;dbname=fxteam';
$username = 'eapps';
$password = 'E@pps123';
$options = array(
    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
); 

$dbh = new PDO($dsn, $username, $password, $options);

if($dbh)
    echo 'Database Connected Successfully';
?>
