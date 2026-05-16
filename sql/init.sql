CREATE DATABASE IF NOT EXISTS student_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE student_db;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    major VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (name, age, gender, major, phone) VALUES
('张三', 20, '男', '计算机科学与技术', '13800138001'),
('李四', 21, '女', '软件工程', '13800138002'),
('王五', 19, '男', '人工智能', '13800138003'),
('赵六', 22, '女', '数据科学', '13800138004'),
('钱七', 20, '男', '网络工程', '13800138005');