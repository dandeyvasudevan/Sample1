-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Mar 24, 2015 at 11:22 PM
-- Server version: 5.5.40-0ubuntu0.14.04.1
-- PHP Version: 5.5.9-1ubuntu4.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `sample_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `oauth_access_tokens`
--

CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `consumer_key` varchar(30) NOT NULL,
  `access_token` varchar(16) NOT NULL,
  `access_token_secret` varchar(32) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `oauth_access_tokens`
--

INSERT INTO `oauth_access_tokens` (`id`, `consumer_key`, `access_token`, `access_token_secret`, `user_id`, `created_date`, `last_used_date`) VALUES
(1, '', 'a5224787e5425b21', 'e09122b78ceee7a20b3c57c240c2ddb8', 1, '2015-03-24 17:27:47', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `oauth_consumers`
--

CREATE TABLE IF NOT EXISTS `oauth_consumers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `consumer_key` varchar(30) NOT NULL,
  `consumer_secret` varchar(10) NOT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int(11) NOT NULL,
  `application` varchar(255) DEFAULT NULL,
  `description` text,
  `callback_url` varchar(500) DEFAULT NULL,
  `enable_password_grant` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=17 ;

--
-- Dumping data for table `oauth_consumers`
--

INSERT INTO `oauth_consumers` (`id`, `consumer_key`, `consumer_secret`, `created_date`, `user_id`, `application`, `description`, `callback_url`, `enable_password_grant`) VALUES
(1, 'web2', 'web2secret', '2014-10-20 05:46:25', 1, NULL, NULL, NULL, 1),
(2, 'web3', 'web3secret', '2014-12-04 15:47:44', 2, NULL, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `last_login` int(11) DEFAULT NULL,
  `admin` tinyint(1) DEFAULT '0',
  `full_name` varchar(200) DEFAULT NULL,
  `fbusername` varchar(100) NOT NULL,
  `active` int(11) DEFAULT NULL,
  `request_code` char(8) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=22 ;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `last_login`, `admin`, `full_name`, `fbusername`, `active`, `request_code`) VALUES
(1, 'admin', 'f134cfa7858e5c4674ef55d3d3284b1c', 'dandeyvasudevan@gmail.com', NULL, 1, 'vasudevan Dandey', '', 1, NULL),
(2, 'user', '0b252a32f3a0cde59b2de832af3358a2', 'vasudevandandey@yahoo.co.in', NULL, 0, 'User', '', 1, NULL);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
