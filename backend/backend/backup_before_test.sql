-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: attendance_system
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_years`
--

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_records`
--

DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','absent','late','leave_early','on_leave') COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_type_id` int DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_records_student_id_attendance_date_key` (`student_id`,`attendance_date`),
  KEY `attendance_records_class_id_fkey` (`class_id`),
  KEY `attendance_records_leave_type_id_fkey` (`leave_type_id`),
  KEY `attendance_records_created_by_fkey` (`created_by`),
  CONSTRAINT `attendance_records_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `attendance_records_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `attendance_records_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `attendance_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_records`
--

LOCK TABLES `attendance_records` WRITE;
/*!40000 ALTER TABLE `attendance_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade_id` int NOT NULL,
  `school_year` year NOT NULL,
  PRIMARY KEY (`id`),
  KEY `classes_grade_id_fkey` (`grade_id`),
  CONSTRAINT `classes_grade_id_fkey` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,'1A',1,2025),(2,'2A',2,2025),(3,'3A',3,2025),(4,'4A',4,2025),(5,'5A',5,2025),(6,'6A',6,2025),(7,'7A',7,2025),(8,'8A',8,2025),(9,'9A',9,2025),(10,'10A',10,2025),(11,'11A',11,2025),(12,'12A',12,2025);
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,'1A'),(2,'2A'),(3,'3A'),(4,'4A'),(5,'5A'),(6,'6A'),(7,'7A'),(8,'8A'),(9,'9A'),(10,'10A'),(11,'11A'),(12,'12A');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `season_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `holidays_season_id_fkey` (`season_id`),
  CONSTRAINT `holidays_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_full_day` tinyint(1) NOT NULL DEFAULT '1',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_requests_student_id_fkey` (`student_id`),
  KEY `leave_requests_leave_type_id_fkey` (`leave_type_id`),
  KEY `leave_requests_created_by_fkey` (`created_by`),
  KEY `leave_requests_approved_by_fkey` (`approved_by`),
  CONSTRAINT `leave_requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `leave_requests_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_requests_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_requests_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` VALUES (1,'事假','Personal leave'),(2,'病假','Sick leave'),(3,'公假','Official leave'),(4,'喪假','Bereavement leave');
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seasons`
--

DROP TABLE IF EXISTS `seasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seasons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('fall','winter','spring','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `academic_year_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `seasons_academic_year_id_fkey` (`academic_year_id`),
  CONSTRAINT `seasons_academic_year_id_fkey` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seasons`
--

LOCK TABLES `seasons` WRITE;
/*!40000 ALTER TABLE `seasons` DISABLE KEYS */;
/*!40000 ALTER TABLE `seasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_class_enrollments`
--

DROP TABLE IF EXISTS `student_class_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_class_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `school_year` year NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `student_class_enrollments_student_id_fkey` (`student_id`),
  KEY `student_class_enrollments_class_id_fkey` (`class_id`),
  CONSTRAINT `student_class_enrollments_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_class_enrollments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=219 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_class_enrollments`
--

LOCK TABLES `student_class_enrollments` WRITE;
/*!40000 ALTER TABLE `student_class_enrollments` DISABLE KEYS */;
INSERT INTO `student_class_enrollments` VALUES (1,1,1,2025,'2025-09-22 07:00:08.402'),(2,2,1,2025,'2025-09-22 07:00:08.402'),(3,3,1,2025,'2025-09-22 07:00:08.402'),(4,4,1,2025,'2025-09-22 07:00:08.402'),(5,5,1,2025,'2025-09-22 07:00:08.402'),(6,6,1,2025,'2025-09-22 07:00:08.402'),(7,7,1,2025,'2025-09-22 07:00:08.402'),(8,8,1,2025,'2025-09-22 07:00:08.402'),(9,9,1,2025,'2025-09-22 07:00:08.402'),(10,10,1,2025,'2025-09-22 07:00:08.402'),(11,11,1,2025,'2025-09-22 07:00:08.402'),(12,12,1,2025,'2025-09-22 07:00:08.402'),(13,13,2,2025,'2025-09-22 07:00:08.402'),(14,14,2,2025,'2025-09-22 07:00:08.402'),(15,15,2,2025,'2025-09-22 07:00:08.402'),(16,16,2,2025,'2025-09-22 07:00:08.402'),(17,17,2,2025,'2025-09-22 07:00:08.402'),(18,18,2,2025,'2025-09-22 07:00:08.402'),(19,19,2,2025,'2025-09-22 07:00:08.402'),(20,20,2,2025,'2025-09-22 07:00:08.402'),(21,21,2,2025,'2025-09-22 07:00:08.402'),(22,22,2,2025,'2025-09-22 07:00:08.402'),(23,23,2,2025,'2025-09-22 07:00:08.402'),(24,24,2,2025,'2025-09-22 07:00:08.402'),(25,25,2,2025,'2025-09-22 07:00:08.402'),(26,26,2,2025,'2025-09-22 07:00:08.402'),(27,27,2,2025,'2025-09-22 07:00:08.402'),(28,28,2,2025,'2025-09-22 07:00:08.402'),(29,29,3,2025,'2025-09-22 07:00:08.402'),(30,30,3,2025,'2025-09-22 07:00:08.402'),(31,31,3,2025,'2025-09-22 07:00:08.402'),(32,32,3,2025,'2025-09-22 07:00:08.402'),(33,33,3,2025,'2025-09-22 07:00:08.402'),(34,34,3,2025,'2025-09-22 07:00:08.402'),(35,35,3,2025,'2025-09-22 07:00:08.402'),(36,36,3,2025,'2025-09-22 07:00:08.402'),(37,37,3,2025,'2025-09-22 07:00:08.402'),(38,38,3,2025,'2025-09-22 07:00:08.402'),(39,39,3,2025,'2025-09-22 07:00:08.402'),(40,40,3,2025,'2025-09-22 07:00:08.402'),(41,41,3,2025,'2025-09-22 07:00:08.402'),(42,42,3,2025,'2025-09-22 07:00:08.402'),(43,43,3,2025,'2025-09-22 07:00:08.402'),(44,44,4,2025,'2025-09-22 07:00:08.402'),(45,45,4,2025,'2025-09-22 07:00:08.402'),(46,46,4,2025,'2025-09-22 07:00:08.402'),(47,47,4,2025,'2025-09-22 07:00:08.402'),(48,48,4,2025,'2025-09-22 07:00:08.402'),(49,49,4,2025,'2025-09-22 07:00:08.402'),(50,50,4,2025,'2025-09-22 07:00:08.402'),(51,51,4,2025,'2025-09-22 07:00:08.402'),(52,52,4,2025,'2025-09-22 07:00:08.402'),(53,53,4,2025,'2025-09-22 07:00:08.402'),(54,54,4,2025,'2025-09-22 07:00:08.402'),(55,55,4,2025,'2025-09-22 07:00:08.402'),(56,56,4,2025,'2025-09-22 07:00:08.402'),(57,57,4,2025,'2025-09-22 07:00:08.402'),(58,58,4,2025,'2025-09-22 07:00:08.402'),(59,59,4,2025,'2025-09-22 07:00:08.402'),(60,60,5,2025,'2025-09-22 07:00:08.402'),(61,61,5,2025,'2025-09-22 07:00:08.402'),(62,62,5,2025,'2025-09-22 07:00:08.402'),(63,63,5,2025,'2025-09-22 07:00:08.402'),(64,64,5,2025,'2025-09-22 07:00:08.402'),(65,65,5,2025,'2025-09-22 07:00:08.402'),(66,66,5,2025,'2025-09-22 07:00:08.402'),(67,67,5,2025,'2025-09-22 07:00:08.402'),(68,68,5,2025,'2025-09-22 07:00:08.402'),(69,69,5,2025,'2025-09-22 07:00:08.402'),(70,70,5,2025,'2025-09-22 07:00:08.402'),(71,71,5,2025,'2025-09-22 07:00:08.402'),(72,72,5,2025,'2025-09-22 07:00:08.402'),(73,73,5,2025,'2025-09-22 07:00:08.402'),(74,74,5,2025,'2025-09-22 07:00:08.402'),(75,75,5,2025,'2025-09-22 07:00:08.402'),(76,76,5,2025,'2025-09-22 07:00:08.402'),(77,77,5,2025,'2025-09-22 07:00:08.402'),(78,78,5,2025,'2025-09-22 07:00:08.402'),(79,79,5,2025,'2025-09-22 07:00:08.402'),(80,80,5,2025,'2025-09-22 07:00:08.402'),(81,81,5,2025,'2025-09-22 07:00:08.402'),(82,82,5,2025,'2025-09-22 07:00:08.402'),(83,83,5,2025,'2025-09-22 07:00:08.402'),(84,84,5,2025,'2025-09-22 07:00:08.402'),(85,85,5,2025,'2025-09-22 07:00:08.402'),(86,86,5,2025,'2025-09-22 07:00:08.402'),(87,87,5,2025,'2025-09-22 07:00:08.402'),(88,88,6,2025,'2025-09-22 07:00:08.402'),(89,89,6,2025,'2025-09-22 07:00:08.402'),(90,90,6,2025,'2025-09-22 07:00:08.402'),(91,91,6,2025,'2025-09-22 07:00:08.402'),(92,92,6,2025,'2025-09-22 07:00:08.402'),(93,93,6,2025,'2025-09-22 07:00:08.402'),(94,94,6,2025,'2025-09-22 07:00:08.402'),(95,95,6,2025,'2025-09-22 07:00:08.402'),(96,96,6,2025,'2025-09-22 07:00:08.402'),(97,97,6,2025,'2025-09-22 07:00:08.402'),(98,98,6,2025,'2025-09-22 07:00:08.402'),(99,99,6,2025,'2025-09-22 07:00:08.402'),(100,100,6,2025,'2025-09-22 07:00:08.402'),(101,101,6,2025,'2025-09-22 07:00:08.402'),(102,102,6,2025,'2025-09-22 07:00:08.402'),(103,103,6,2025,'2025-09-22 07:00:08.402'),(104,104,6,2025,'2025-09-22 07:00:08.402'),(105,105,6,2025,'2025-09-22 07:00:08.402'),(106,106,7,2025,'2025-09-22 07:00:08.402'),(107,107,7,2025,'2025-09-22 07:00:08.402'),(108,108,7,2025,'2025-09-22 07:00:08.402'),(109,109,7,2025,'2025-09-22 07:00:08.402'),(110,110,7,2025,'2025-09-22 07:00:08.402'),(111,111,7,2025,'2025-09-22 07:00:08.402'),(112,112,7,2025,'2025-09-22 07:00:08.402'),(113,113,7,2025,'2025-09-22 07:00:08.402'),(114,114,7,2025,'2025-09-22 07:00:08.402'),(115,115,7,2025,'2025-09-22 07:00:08.402'),(116,116,7,2025,'2025-09-22 07:00:08.402'),(117,117,7,2025,'2025-09-22 07:00:08.402'),(118,118,7,2025,'2025-09-22 07:00:08.402'),(119,119,7,2025,'2025-09-22 07:00:08.402'),(120,120,7,2025,'2025-09-22 07:00:08.402'),(121,121,7,2025,'2025-09-22 07:00:08.402'),(122,122,7,2025,'2025-09-22 07:00:08.402'),(123,123,7,2025,'2025-09-22 07:00:08.402'),(124,124,7,2025,'2025-09-22 07:00:08.402'),(125,125,7,2025,'2025-09-22 07:00:08.402'),(126,126,7,2025,'2025-09-22 07:00:08.402'),(127,127,7,2025,'2025-09-22 07:00:08.402'),(128,128,7,2025,'2025-09-22 07:00:08.402'),(129,129,7,2025,'2025-09-22 07:00:08.402'),(130,130,7,2025,'2025-09-22 07:00:08.402'),(131,131,8,2025,'2025-09-22 07:00:08.402'),(132,132,8,2025,'2025-09-22 07:00:08.402'),(133,133,8,2025,'2025-09-22 07:00:08.402'),(134,134,8,2025,'2025-09-22 07:00:08.402'),(135,135,8,2025,'2025-09-22 07:00:08.402'),(136,136,8,2025,'2025-09-22 07:00:08.402'),(137,137,8,2025,'2025-09-22 07:00:08.402'),(138,138,8,2025,'2025-09-22 07:00:08.402'),(139,139,8,2025,'2025-09-22 07:00:08.402'),(140,140,8,2025,'2025-09-22 07:00:08.402'),(141,141,8,2025,'2025-09-22 07:00:08.402'),(142,142,8,2025,'2025-09-22 07:00:08.402'),(143,143,8,2025,'2025-09-22 07:00:08.402'),(144,144,8,2025,'2025-09-22 07:00:08.402'),(145,145,8,2025,'2025-09-22 07:00:08.402'),(146,146,8,2025,'2025-09-22 07:00:08.402'),(147,147,8,2025,'2025-09-22 07:00:08.402'),(148,148,9,2025,'2025-09-22 07:00:08.402'),(149,149,9,2025,'2025-09-22 07:00:08.402'),(150,150,9,2025,'2025-09-22 07:00:08.402'),(151,151,9,2025,'2025-09-22 07:00:08.402'),(152,152,9,2025,'2025-09-22 07:00:08.402'),(153,153,9,2025,'2025-09-22 07:00:08.402'),(154,154,9,2025,'2025-09-22 07:00:08.402'),(155,155,9,2025,'2025-09-22 07:00:08.402'),(156,156,9,2025,'2025-09-22 07:00:08.402'),(157,157,9,2025,'2025-09-22 07:00:08.402'),(158,158,9,2025,'2025-09-22 07:00:08.402'),(159,159,9,2025,'2025-09-22 07:00:08.402'),(160,160,9,2025,'2025-09-22 07:00:08.402'),(161,161,9,2025,'2025-09-22 07:00:08.402'),(162,162,9,2025,'2025-09-22 07:00:08.402'),(163,163,9,2025,'2025-09-22 07:00:08.402'),(164,164,9,2025,'2025-09-22 07:00:08.402'),(165,165,9,2025,'2025-09-22 07:00:08.402'),(166,166,9,2025,'2025-09-22 07:00:08.402'),(167,167,9,2025,'2025-09-22 07:00:08.402'),(168,168,9,2025,'2025-09-22 07:00:08.402'),(169,169,9,2025,'2025-09-22 07:00:08.402'),(170,170,9,2025,'2025-09-22 07:00:08.402'),(171,171,9,2025,'2025-09-22 07:00:08.402'),(172,172,9,2025,'2025-09-22 07:00:08.402'),(173,173,9,2025,'2025-09-22 07:00:08.402'),(174,174,10,2025,'2025-09-22 07:00:08.402'),(175,175,10,2025,'2025-09-22 07:00:08.402'),(176,176,10,2025,'2025-09-22 07:00:08.402'),(177,177,10,2025,'2025-09-22 07:00:08.402'),(178,178,10,2025,'2025-09-22 07:00:08.402'),(179,179,10,2025,'2025-09-22 07:00:08.402'),(180,180,10,2025,'2025-09-22 07:00:08.402'),(181,181,10,2025,'2025-09-22 07:00:08.402'),(182,182,10,2025,'2025-09-22 07:00:08.402'),(183,183,10,2025,'2025-09-22 07:00:08.402'),(184,184,10,2025,'2025-09-22 07:00:08.402'),(185,185,10,2025,'2025-09-22 07:00:08.402'),(186,186,10,2025,'2025-09-22 07:00:08.402'),(187,187,10,2025,'2025-09-22 07:00:08.402'),(188,188,11,2025,'2025-09-22 07:00:08.402'),(189,189,11,2025,'2025-09-22 07:00:08.402'),(190,190,11,2025,'2025-09-22 07:00:08.402'),(191,191,11,2025,'2025-09-22 07:00:08.402'),(192,192,11,2025,'2025-09-22 07:00:08.402'),(193,193,11,2025,'2025-09-22 07:00:08.402'),(194,194,11,2025,'2025-09-22 07:00:08.402'),(195,195,11,2025,'2025-09-22 07:00:08.402'),(196,196,11,2025,'2025-09-22 07:00:08.402'),(197,197,11,2025,'2025-09-22 07:00:08.402'),(198,198,11,2025,'2025-09-22 07:00:08.402'),(199,199,11,2025,'2025-09-22 07:00:08.402'),(200,200,11,2025,'2025-09-22 07:00:08.402'),(201,201,11,2025,'2025-09-22 07:00:08.402'),(202,202,11,2025,'2025-09-22 07:00:08.402'),(203,203,11,2025,'2025-09-22 07:00:08.402'),(204,204,11,2025,'2025-09-22 07:00:08.402'),(205,205,12,2025,'2025-09-22 07:00:08.402'),(206,206,12,2025,'2025-09-22 07:00:08.402'),(207,207,12,2025,'2025-09-22 07:00:08.402'),(208,208,12,2025,'2025-09-22 07:00:08.402'),(209,209,12,2025,'2025-09-22 07:00:08.402'),(210,210,12,2025,'2025-09-22 07:00:08.402'),(211,211,12,2025,'2025-09-22 07:00:08.402'),(212,212,12,2025,'2025-09-22 07:00:08.402'),(213,213,12,2025,'2025-09-22 07:00:08.402'),(214,214,12,2025,'2025-09-22 07:00:08.402'),(215,215,12,2025,'2025-09-22 07:00:08.402'),(216,216,12,2025,'2025-09-22 07:00:08.402'),(217,217,12,2025,'2025-09-22 07:00:08.402'),(218,218,12,2025,'2025-09-22 07:00:08.402');
/*!40000 ALTER TABLE `student_class_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthday` date NOT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','transferred_out','graduated','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `enrollment_date` date NOT NULL,
  `departure_date` date DEFAULT NULL,
  `departure_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_student_id_key` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=219 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'T11403','李忻修','2000-01-01','other','active','2025-09-01',NULL,NULL),(2,'T11401','曹琍媛','2000-01-01','other','active','2025-09-01',NULL,NULL),(3,'T11407','蔡寧允','2000-01-01','other','active','2025-09-01',NULL,NULL),(4,'T11402','張家菁','2000-01-01','other','active','2025-09-01',NULL,NULL),(5,'T11408','陳柏宇','2000-01-01','other','active','2025-09-01',NULL,NULL),(6,'T11404','黃彣妍','2000-01-01','other','active','2025-09-01',NULL,NULL),(7,'T11406','陳以恩','2000-01-01','other','active','2025-09-01',NULL,NULL),(8,'T11405','陳允曦','2000-01-01','other','active','2025-09-01',NULL,NULL),(9,'T11410','張瀚宇','2000-01-01','other','active','2025-09-01',NULL,NULL),(10,'T11409','蔡沐岑','2000-01-01','other','active','2025-09-01',NULL,NULL),(11,'T11412','林丞熙','2000-01-01','other','active','2025-09-01',NULL,NULL),(12,'T11411','翁睿岑','2000-01-01','other','active','2025-09-01',NULL,NULL),(13,'R11205','洪御皓','2000-01-01','other','active','2025-09-01',NULL,NULL),(14,'S11314','陳右庭','2000-01-01','other','active','2025-09-01',NULL,NULL),(15,'S11308','沈恩圻','2000-01-01','other','active','2025-09-01',NULL,NULL),(16,'S11307','顏品悅','2000-01-01','other','active','2025-09-01',NULL,NULL),(17,'S11302','吳安實','2000-01-01','other','active','2025-09-01',NULL,NULL),(18,'S11306','林宸翟','2000-01-01','other','active','2025-09-01',NULL,NULL),(19,'S11309','楊粢宇','2000-01-01','other','active','2025-09-01',NULL,NULL),(20,'S11310','馮書宇','2000-01-01','other','active','2025-09-01',NULL,NULL),(21,'S11304','林育帆','2000-01-01','other','active','2025-09-01',NULL,NULL),(22,'S11305','李重希','2000-01-01','other','active','2025-09-01',NULL,NULL),(23,'S11303','李亮儀','2000-01-01','other','active','2025-09-01',NULL,NULL),(24,'S11313','陳怡蒼','2000-01-01','other','active','2025-09-01',NULL,NULL),(25,'S11301','蔡雨泱','2000-01-01','other','active','2025-09-01',NULL,NULL),(26,'S11312','徐定堉','2000-01-01','other','active','2025-09-01',NULL,NULL),(27,'S11311','吳思','2000-01-01','other','active','2025-09-01',NULL,NULL),(28,'S11315','黃琳斐','2000-01-01','other','active','2025-09-01',NULL,NULL),(29,'R11214','廖偉辰','2000-01-01','other','active','2025-09-01',NULL,NULL),(30,'R11208','廖柏軒','2000-01-01','other','active','2025-09-01',NULL,NULL),(31,'R11213','張詔傑','2000-01-01','other','active','2025-09-01',NULL,NULL),(32,'R11206','黃唯時','2000-01-01','other','active','2025-09-01',NULL,NULL),(33,'R11215','吳鎮宇','2000-01-01','other','active','2025-09-01',NULL,NULL),(34,'R11202','朱栩瑤','2000-01-01','other','active','2025-09-01',NULL,NULL),(35,'Q11104','余承順','2000-01-01','other','active','2025-09-01',NULL,NULL),(36,'R11203','黃郁潔','2000-01-01','other','active','2025-09-01',NULL,NULL),(37,'R11216','曾昱華','2000-01-01','other','active','2025-09-01',NULL,NULL),(38,'R11217','林家安','2000-01-01','other','active','2025-09-01',NULL,NULL),(39,'R11204','謝地','2000-01-01','other','active','2025-09-01',NULL,NULL),(40,'R11207','楊易瑋','2000-01-01','other','active','2025-09-01',NULL,NULL),(41,'R11218','陳映崨','2000-01-01','other','active','2025-09-01',NULL,NULL),(42,'R11210','江子琪','2000-01-01','other','active','2025-09-01',NULL,NULL),(43,'R11209','周茄','2000-01-01','other','active','2025-09-01',NULL,NULL),(44,'Q11118','倪宇樂','2000-01-01','other','active','2025-09-01',NULL,NULL),(45,'Q11111','陳稚甯','2000-01-01','other','active','2025-09-01',NULL,NULL),(46,'Q11108','任煦安','2000-01-01','other','active','2025-09-01',NULL,NULL),(47,'Q11101','曹睿軒','2000-01-01','other','active','2025-09-01',NULL,NULL),(48,'Q11107','陳薏蔓','2000-01-01','other','active','2025-09-01',NULL,NULL),(49,'Q11119','林芸熙','2000-01-01','other','active','2025-09-01',NULL,NULL),(50,'Q11113','李東叡','2000-01-01','other','active','2025-09-01',NULL,NULL),(51,'Q11112','賴麗國','2000-01-01','other','active','2025-09-01',NULL,NULL),(52,'Q11102','蔡岳宸','2000-01-01','other','active','2025-09-01',NULL,NULL),(53,'Q11105','許芯菲','2000-01-01','other','active','2025-09-01',NULL,NULL),(54,'Q11103','高元鈞','2000-01-01','other','active','2025-09-01',NULL,NULL),(55,'Q11109','黃心妮','2000-01-01','other','active','2025-09-01',NULL,NULL),(56,'Q11114','林瑾媗','2000-01-01','other','active','2025-09-01',NULL,NULL),(57,'Q11115','王少甫','2000-01-01','other','active','2025-09-01',NULL,NULL),(58,'Q11116','蔡寧家','2000-01-01','other','active','2025-09-01',NULL,NULL),(59,'Q11117','陳亮衡','2000-01-01','other','active','2025-09-01',NULL,NULL),(60,'P11032','林宸安','2000-01-01','other','active','2025-09-01',NULL,NULL),(61,'P11006','陳星瑜','2000-01-01','other','active','2025-09-01',NULL,NULL),(62,'P11008','陳以宸','2000-01-01','other','active','2025-09-01',NULL,NULL),(63,'P11021','沈敬閔','2000-01-01','other','active','2025-09-01',NULL,NULL),(64,'P11015','楊東穆','2000-01-01','other','active','2025-09-01',NULL,NULL),(65,'P11005','林妡縈','2000-01-01','other','active','2025-09-01',NULL,NULL),(66,'P11001','莊秉霖','2000-01-01','other','active','2025-09-01',NULL,NULL),(67,'P11007','王苡婕','2000-01-01','other','active','2025-09-01',NULL,NULL),(68,'P11003','楊岱鋼','2000-01-01','other','active','2025-09-01',NULL,NULL),(69,'P11023','陳彥均','2000-01-01','other','active','2025-09-01',NULL,NULL),(70,'P11011','陳宇翔','2000-01-01','other','active','2025-09-01',NULL,NULL),(71,'P11012','張鈺穎','2000-01-01','other','active','2025-09-01',NULL,NULL),(72,'P11017','劉宥廷','2000-01-01','other','active','2025-09-01',NULL,NULL),(73,'P11019','王凱宣','2000-01-01','other','active','2025-09-01',NULL,NULL),(74,'P11013','葉翊廷','2000-01-01','other','active','2025-09-01',NULL,NULL),(75,'P11014','黃卉歆','2000-01-01','other','active','2025-09-01',NULL,NULL),(76,'P11010','洪御恩','2000-01-01','other','active','2025-09-01',NULL,NULL),(77,'O10915','王子彤','2000-01-01','other','active','2025-09-01',NULL,NULL),(78,'P11002','楊岱融','2000-01-01','other','active','2025-09-01',NULL,NULL),(79,'P11020','陳亭羽','2000-01-01','other','active','2025-09-01',NULL,NULL),(80,'P11033','陳映言','2000-01-01','other','active','2025-09-01',NULL,NULL),(81,'P11029','施衍佐','2000-01-01','other','active','2025-09-01',NULL,NULL),(82,'P11025','陳柏叡','2000-01-01','other','active','2025-09-01',NULL,NULL),(83,'P11035','蔡懷賞','2000-01-01','other','active','2025-09-01',NULL,NULL),(84,'P11031','賴靚齊','2000-01-01','other','active','2025-09-01',NULL,NULL),(85,'P11028','吳芷安','2000-01-01','other','active','2025-09-01',NULL,NULL),(86,'P11030','曾謙浩','2000-01-01','other','active','2025-09-01',NULL,NULL),(87,'P11027','廖婕妤','2000-01-01','other','active','2025-09-01',NULL,NULL),(88,'O10903','黃士祈','2000-01-01','other','active','2025-09-01',NULL,NULL),(89,'O10904','余振林','2000-01-01','other','active','2025-09-01',NULL,NULL),(90,'O10905','曹恩維','2000-01-01','other','active','2025-09-01',NULL,NULL),(91,'O10906','鄭梓青','2000-01-01','other','active','2025-09-01',NULL,NULL),(92,'O10908','黃暄竣','2000-01-01','other','active','2025-09-01',NULL,NULL),(93,'O10909','陳宇澔','2000-01-01','other','active','2025-09-01',NULL,NULL),(94,'N10821','陳昱男','2000-01-01','other','active','2025-09-01',NULL,NULL),(95,'O10911','謝  天','2000-01-01','other','active','2025-09-01',NULL,NULL),(96,'O10913','黃首德','2000-01-01','other','active','2025-09-01',NULL,NULL),(97,'O10902','蔡可歆','2000-01-01','other','active','2025-09-01',NULL,NULL),(98,'O10907','鄭梓宥','2000-01-01','other','active','2025-09-01',NULL,NULL),(99,'O10914','陳妍心','2000-01-01','other','active','2025-09-01',NULL,NULL),(100,'O10916','吳淳真','2000-01-01','other','active','2025-09-01',NULL,NULL),(101,'O10917','何定謙','2000-01-01','other','active','2025-09-01',NULL,NULL),(102,'O10918','陳余運','2000-01-01','other','active','2025-09-01',NULL,NULL),(103,'O10901','林澍右','2000-01-01','other','active','2025-09-01',NULL,NULL),(104,'O10919','吳沁耘','2000-01-01','other','active','2025-09-01',NULL,NULL),(105,'O10920','廖芷瑄','2000-01-01','other','active','2025-09-01',NULL,NULL),(106,'N10807','許貫堯','2000-01-01','other','active','2025-09-01',NULL,NULL),(107,'N10831','林永晨','2000-01-01','other','active','2025-09-01',NULL,NULL),(108,'N10810','楊詠丞','2000-01-01','other','active','2025-09-01',NULL,NULL),(109,'N10823','王維翔','2000-01-01','other','active','2025-09-01',NULL,NULL),(110,'N10832','陳映澄','2000-01-01','other','active','2025-09-01',NULL,NULL),(111,'N10809','戴維萱','2000-01-01','other','active','2025-09-01',NULL,NULL),(112,'N10825','劉洲睿','2000-01-01','other','active','2025-09-01',NULL,NULL),(113,'N10803','余旻華','2000-01-01','other','active','2025-09-01',NULL,NULL),(114,'N10805','陳柏綝','2000-01-01','other','active','2025-09-01',NULL,NULL),(115,'N10802','施亮琦','2000-01-01','other','active','2025-09-01',NULL,NULL),(116,'N10808','葉奕辰','2000-01-01','other','active','2025-09-01',NULL,NULL),(117,'N10822','王裔騰','2000-01-01','other','active','2025-09-01',NULL,NULL),(118,'N10815','張修福','2000-01-01','other','active','2025-09-01',NULL,NULL),(119,'N10806','楊棠心','2000-01-01','other','active','2025-09-01',NULL,NULL),(120,'M10719','方紹宸','2000-01-01','other','active','2025-09-01',NULL,NULL),(121,'N10814','林芩如','2000-01-01','other','active','2025-09-01',NULL,NULL),(122,'N10811','高元暘','2000-01-01','other','active','2025-09-01',NULL,NULL),(123,'N10801','林禾晴','2000-01-01','other','active','2025-09-01',NULL,NULL),(124,'N10812','黃紹恩','2000-01-01','other','active','2025-09-01',NULL,NULL),(125,'N10824','夏子揚','2000-01-01','other','active','2025-09-01',NULL,NULL),(126,'N10804','吳子杰','2000-01-01','other','active','2025-09-01',NULL,NULL),(127,'N10826','黃麟筌','2000-01-01','other','active','2025-09-01',NULL,NULL),(128,'N10830','吳忻庭','2000-01-01','other','active','2025-09-01',NULL,NULL),(129,'N10829','陳宥霖','2000-01-01','other','active','2025-09-01',NULL,NULL),(130,'N10828','林靚琝','2000-01-01','other','active','2025-09-01',NULL,NULL),(131,'M10720','梁涵晰','2000-01-01','other','active','2025-09-01',NULL,NULL),(132,'M10703','楊杰靛','2000-01-01','other','active','2025-09-01',NULL,NULL),(133,'M10723','朱柏穎','2000-01-01','other','active','2025-09-01',NULL,NULL),(134,'M10713','劉星伶','2000-01-01','other','active','2025-09-01',NULL,NULL),(135,'M10712','林亦欣','2000-01-01','other','active','2025-09-01',NULL,NULL),(136,'M10705','吳軒彤','2000-01-01','other','active','2025-09-01',NULL,NULL),(137,'M10701','董子莊','2000-01-01','other','active','2025-09-01',NULL,NULL),(138,'M10715','紀沛樂','2000-01-01','other','active','2025-09-01',NULL,NULL),(139,'M10709','鄭榆家','2000-01-01','other','active','2025-09-01',NULL,NULL),(140,'M10710','陳昕妤','2000-01-01','other','active','2025-09-01',NULL,NULL),(141,'M10730','林沂希','2000-01-01','other','active','2025-09-01',NULL,NULL),(142,'M10727','劉宥岑','2000-01-01','other','active','2025-09-01',NULL,NULL),(143,'M10722','鍾佳莉','2000-01-01','other','active','2025-09-01',NULL,NULL),(144,'M10724','丁章恩','2000-01-01','other','active','2025-09-01',NULL,NULL),(145,'M10731','林璟宥','2000-01-01','other','active','2025-09-01',NULL,NULL),(146,'M10702','林鑫辰','2000-01-01','other','active','2025-09-01',NULL,NULL),(147,'M10714','黃首傅','2000-01-01','other','active','2025-09-01',NULL,NULL),(148,'L10633','陳晉諺','2000-01-01','other','active','2025-09-01',NULL,NULL),(149,'L10613','馬敬筌','2000-01-01','other','active','2025-09-01',NULL,NULL),(150,'L10618','吳學睿','2000-01-01','other','active','2025-09-01',NULL,NULL),(151,'L10635','吳沛芝','2000-01-01','other','active','2025-09-01',NULL,NULL),(152,'L10604','楊絨晟','2000-01-01','other','active','2025-09-01',NULL,NULL),(153,'L10612','李秉學','2000-01-01','other','active','2025-09-01',NULL,NULL),(154,'L10616','許力恆','2000-01-01','other','active','2025-09-01',NULL,NULL),(155,'L10607','蔡沂秀','2000-01-01','other','active','2025-09-01',NULL,NULL),(156,'L10626','顏唯恩','2000-01-01','other','active','2025-09-01',NULL,NULL),(157,'L10621','楊憶玟','2000-01-01','other','active','2025-09-01',NULL,NULL),(158,'L10603','張承輝','2000-01-01','other','active','2025-09-01',NULL,NULL),(159,'K10517','雲詠傑','2000-01-01','other','active','2025-09-01',NULL,NULL),(160,'L10622','李欣儒','2000-01-01','other','active','2025-09-01',NULL,NULL),(161,'L10630','廖筱芸','2000-01-01','other','active','2025-09-01',NULL,NULL),(162,'L10615','邱悅暖','2000-01-01','other','active','2025-09-01',NULL,NULL),(163,'L10606','許梓涵','2000-01-01','other','active','2025-09-01',NULL,NULL),(164,'L10627','夏壐恩','2000-01-01','other','active','2025-09-01',NULL,NULL),(165,'L10619','陳以軒','2000-01-01','other','active','2025-09-01',NULL,NULL),(166,'L10608','蔡書丞','2000-01-01','other','active','2025-09-01',NULL,NULL),(167,'L10637','賴筠思','2000-01-01','other','active','2025-09-01',NULL,NULL),(168,'L10631','莊昕','2000-01-01','other','active','2025-09-01',NULL,NULL),(169,'L10623','黃小軒','2000-01-01','other','active','2025-09-01',NULL,NULL),(170,'L10602','鄭筱霏','2000-01-01','other','active','2025-09-01',NULL,NULL),(171,'L10632','陳欲晨','2000-01-01','other','active','2025-09-01',NULL,NULL),(172,'L10610','謝馨萮','2000-01-01','other','active','2025-09-01',NULL,NULL),(173,'L10634','何芊謙','2000-01-01','other','active','2025-09-01',NULL,NULL),(174,'K10532','張恩睿','2000-01-01','other','active','2025-09-01',NULL,NULL),(175,'K10525','童渝芯','2000-01-01','other','active','2025-09-01',NULL,NULL),(176,'K10502','林琮人','2000-01-01','other','active','2025-09-01',NULL,NULL),(177,'K10509','劉奐希','2000-01-01','other','active','2025-09-01',NULL,NULL),(178,'K10538','黃亦廷','2000-01-01','other','active','2025-09-01',NULL,NULL),(179,'K10513','洪博鑫','2000-01-01','other','active','2025-09-01',NULL,NULL),(180,'K10537','賴慧國','2000-01-01','other','active','2025-09-01',NULL,NULL),(181,'K10507','羅予葳','2000-01-01','other','active','2025-09-01',NULL,NULL),(182,'J10426','黃湘芸','2000-01-01','other','active','2025-09-01',NULL,NULL),(183,'K10520','林心悅','2000-01-01','other','active','2025-09-01',NULL,NULL),(184,'K10518','雲詠筑','2000-01-01','other','active','2025-09-01',NULL,NULL),(185,'K10536','蔡佳叡','2000-01-01','other','active','2025-09-01',NULL,NULL),(186,'J10445','林孟萱','2000-01-01','other','active','2025-09-01',NULL,NULL),(187,'K10512','方浿旂','2000-01-01','other','active','2025-09-01',NULL,NULL),(188,'J10431','陳孟弘','2000-01-01','other','active','2025-09-01',NULL,NULL),(189,'J10418','楊少軒','2000-01-01','other','active','2025-09-01',NULL,NULL),(190,'J10419','李沛芸','2000-01-01','other','active','2025-09-01',NULL,NULL),(191,'J10401','蔡書妍','2000-01-01','other','active','2025-09-01',NULL,NULL),(192,'J10422','李予昕','2000-01-01','other','active','2025-09-01',NULL,NULL),(193,'J10430','曾郁涵','2000-01-01','other','active','2025-09-01',NULL,NULL),(194,'J10428','何沂蓁','2000-01-01','other','active','2025-09-01',NULL,NULL),(195,'J10413','王暐諺','2000-01-01','other','active','2025-09-01',NULL,NULL),(196,'J10402','王凱亭','2000-01-01','other','active','2025-09-01',NULL,NULL),(197,'J10429','辜紹輔','2000-01-01','other','active','2025-09-01',NULL,NULL),(198,'J10434','張廖嘉嵩','2000-01-01','other','active','2025-09-01',NULL,NULL),(199,'J10437','張恩箖','2000-01-01','other','active','2025-09-01',NULL,NULL),(200,'J10438','王翊庭','2000-01-01','other','active','2025-09-01',NULL,NULL),(201,'J10440','張凱芸','2000-01-01','other','active','2025-09-01',NULL,NULL),(202,'J10441','羅靖麒','2000-01-01','other','active','2025-09-01',NULL,NULL),(203,'J10443','李耕甫','2000-01-01','other','active','2025-09-01',NULL,NULL),(204,'J10444','林施凡','2000-01-01','other','active','2025-09-01',NULL,NULL),(205,'I10345','吳亮岑','2000-01-01','other','active','2025-09-01',NULL,NULL),(206,'I10324','邱悅恆','2000-01-01','other','active','2025-09-01',NULL,NULL),(207,'I10344','黃首仁','2000-01-01','other','active','2025-09-01',NULL,NULL),(208,'I10337','楊有容','2000-01-01','other','active','2025-09-01',NULL,NULL),(209,'I10319','林思妤','2000-01-01','other','active','2025-09-01',NULL,NULL),(210,'I10330','馬竟家','2000-01-01','other','active','2025-09-01',NULL,NULL),(211,'I10331','洪廉莆','2000-01-01','other','active','2025-09-01',NULL,NULL),(212,'I10313','翁芮怡','2000-01-01','other','active','2025-09-01',NULL,NULL),(213,'J10435','張廖芯湄','2000-01-01','other','active','2025-09-01',NULL,NULL),(214,'I10304','許漢霖','2000-01-01','other','active','2025-09-01',NULL,NULL),(215,'I10320','葉璞懷','2000-01-01','other','active','2025-09-01',NULL,NULL),(216,'I10335','董子瑄','2000-01-01','other','active','2025-09-01',NULL,NULL),(217,'I10347','蔡欣宸','2000-01-01','other','active','2025-09-01',NULL,NULL),(218,'I10350','賴安國','2000-01-01','other','active','2025-09-01',NULL,NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_class_assignments`
--

DROP TABLE IF EXISTS `teacher_class_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_class_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `class_id` int NOT NULL,
  `school_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `teacher_class_assignments_teacher_id_fkey` (`teacher_id`),
  KEY `teacher_class_assignments_class_id_fkey` (`class_id`),
  CONSTRAINT `teacher_class_assignments_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `teacher_class_assignments_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_class_assignments`
--

LOCK TABLES `teacher_class_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_class_assignments` DISABLE KEYS */;
INSERT INTO `teacher_class_assignments` VALUES (1,2,10,'2025',NULL,NULL,1,NULL),(2,1,11,'2025',NULL,NULL,1,NULL),(3,3,12,'2025',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `teacher_class_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('teacher','GA_specialist') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'林龍伸','teacher'),(2,'紀輔則','teacher'),(3,'王新','teacher'),(4,'王慧宜','teacher'),(5,'怡茜','GA_specialist'),(6,'安妮','GA_specialist');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-22 15:01:52
