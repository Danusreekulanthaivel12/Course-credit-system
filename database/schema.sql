CREATE DATABASE IF NOT EXISTS course_credit_system;
USE course_credit_system;

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL -- In a real app, hash this!
);

-- Insert default admin if not exists
INSERT IGNORE INTO admins (id, username, password) VALUES (1, 'admin', 'admin123');

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    dept_id INT,
    semester INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    dept_id INT,
    semester INT NOT NULL,
    type ENUM('Regular', 'Elective', 'Minor', 'Honors') DEFAULT 'Regular',
    FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Course Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (student_id, course_id)
);

-- Semester Limits Table
CREATE TABLE IF NOT EXISTS semester_limits (
    semester INT PRIMARY KEY,
    credit_limit INT DEFAULT 25
);

-- Seed Semester Limits (1-8)
INSERT IGNORE INTO semester_limits (semester, credit_limit) VALUES 
(1, 25), (2, 25), (3, 25), (4, 25), (5, 25), (6, 25), (7, 25), (8, 25);
