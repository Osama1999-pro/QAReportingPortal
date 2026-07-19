-- ==========================================================
-- QA PORTAL — MySQL DATABASE SCHEMA
-- Customer Service QA Management System
-- Run this file in a database created for the app, e.g.:
--   mysql -u root -p -e "CREATE DATABASE qa_portal CHARACTER SET utf8mb4;"
--   mysql -u root -p qa_portal < database/schema.sql
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- DEPARTMENTS
-- --------------------------------------------------------
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- TEAMS
-- --------------------------------------------------------
DROP TABLE IF EXISTS teams;
CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_teams_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE KEY uq_team_per_department (name, department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- USERS  (Super Admin, QA Evaluator, Team Lead, Agent)
-- --------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(30) UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','qa_evaluator','team_lead','agent') NOT NULL DEFAULT 'agent',
  department_id INT NULL,
  team_id INT NULL,
  designation VARCHAR(100),
  manager_id INT NULL,
  phone VARCHAR(30),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  avatar_path VARCHAR(255),
  reset_token VARCHAR(255) NULL,
  reset_token_expires DATETIME NULL,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- EVALUATIONS
-- --------------------------------------------------------
DROP TABLE IF EXISTS evaluations;
CREATE TABLE evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluation_code VARCHAR(30) NOT NULL UNIQUE,
  ticket_number VARCHAR(50),
  order_number VARCHAR(50),
  channel ENUM('Email','Live Chat','Facebook','Instagram','WhatsApp','Voice') NOT NULL,
  agent_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  team_lead_id INT NULL,
  team_id INT NULL,
  evaluation_date DATE NOT NULL,
  total_max_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_obtained_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  pass_fail ENUM('Pass','Fail') NOT NULL DEFAULT 'Fail',
  status ENUM('draft','completed','disputed','reopened') NOT NULL DEFAULT 'completed',
  overall_comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_eval_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_team_lead FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_eval_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_eval_date (evaluation_date),
  INDEX idx_eval_agent (agent_id),
  INDEX idx_eval_channel (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- EVALUATION SCORECARD ITEMS
-- One row per scorecard section (Greeting, Verification, Empathy, ...)
-- --------------------------------------------------------
DROP TABLE IF EXISTS evaluation_scorecard_items;
CREATE TABLE evaluation_scorecard_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluation_id INT NOT NULL,
  section_key VARCHAR(50) NOT NULL,
  section_label VARCHAR(100) NOT NULL,
  max_score DECIMAL(6,2) NOT NULL,
  obtained_score DECIMAL(6,2) NOT NULL,
  comments TEXT,
  CONSTRAINT fk_item_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- COACHING
-- --------------------------------------------------------
DROP TABLE IF EXISTS coaching_sessions;
CREATE TABLE coaching_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluation_id INT NULL,
  employee_id INT NOT NULL,
  coach_id INT NOT NULL,
  coaching_date DATE NOT NULL,
  reason TEXT NOT NULL,
  action_plan TEXT NOT NULL,
  follow_up_date DATE,
  status ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_coaching_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL,
  CONSTRAINT fk_coaching_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_coaching_coach FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- SETTINGS (single row configuration table)
-- --------------------------------------------------------
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_name VARCHAR(150) NOT NULL DEFAULT 'QA Portal',
  logo_path VARCHAR(255),
  qa_pass_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  theme ENUM('light','dark') NOT NULL DEFAULT 'light',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- AUDIT LOG
-- --------------------------------------------------------
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(150) NOT NULL,
  details TEXT,
  ip_address VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- SAMPLE DATA
-- ==========================================================

INSERT INTO departments (name) VALUES
 ('Customer Support'), ('E-commerce Operations');

INSERT INTO teams (name, department_id) VALUES
 ('Voice Support', 1), ('Live Chat Support', 1), ('Social Media Support', 1), ('Escalations', 2);

-- Password for ALL sample users below is:  Password123!
-- Hash generated with bcrypt, 12 salt rounds.
INSERT INTO users (employee_code, name, email, password_hash, role, department_id, team_id, designation, manager_id, phone, status) VALUES
 ('EMP-0001','System Administrator','admin@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','super_admin', NULL, NULL, 'System Administrator', NULL, '+92-300-0000001','active'),
 ('EMP-0002','Sara Khan','sara.khan@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','qa_evaluator', 1, 1, 'QA Evaluator', NULL, '+92-300-0000002','active'),
 ('EMP-0003','Junaid Sheikh','junaid.sheikh@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','team_lead', 1, 1, 'Team Lead - Voice', NULL, '+92-300-0000003','active'),
 ('EMP-0004','Rabia Yousuf','rabia.yousuf@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','team_lead', 1, 2, 'Team Lead - Chat', NULL, '+92-300-0000004','active'),
 ('EMP-0005','Bilal Anwar','bilal.anwar@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','agent', 1, 1, 'Support Agent', 3, '+92-300-0000005','active'),
 ('EMP-0006','Ayesha Raza','ayesha.raza@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','agent', 1, 2, 'Support Agent', 4, '+92-300-0000006','active'),
 ('EMP-0007','Hamza Iqbal','hamza.iqbal@qaportal.test','$2b$12$G0v6oVvB8n0iN2rE1s0O6uYVh1uJdGZbYQpG1lQe6m8n0j4G8bWMK','agent', 1, 3, 'Support Agent', 3, '+92-300-0000007','active');

INSERT INTO settings (id, company_name, qa_pass_percentage, theme) VALUES
 (1, 'ShopSphere E-commerce', 80.00, 'light');

-- Sample evaluation
INSERT INTO evaluations (evaluation_code, ticket_number, order_number, channel, agent_id, evaluator_id, team_lead_id, team_id, evaluation_date, total_max_score, total_obtained_score, percentage, pass_fail, status, overall_comments) VALUES
 ('EVAL-100001','TCK-88231','ORD-552310','Voice', 5, 2, 3, 1, CURDATE(), 110, 92, 83.64, 'Pass', 'completed', 'Good resolution, minor gap on policy explanation.');

INSERT INTO evaluation_scorecard_items (evaluation_id, section_key, section_label, max_score, obtained_score, comments) VALUES
 (1,'greeting','Greeting',10,10,'Warm and on-brand opening.'),
 (1,'verification','Verification',10,10,'Correctly verified order and identity.'),
 (1,'empathy','Empathy',10,8,'Could acknowledge frustration earlier.'),
 (1,'product_knowledge','Product Knowledge',10,9,'Accurate return policy details.'),
 (1,'grammar','Grammar',10,9,'Clear, minor phrasing issue.'),
 (1,'communication','Communication',10,9,'Clear pacing and tone.'),
 (1,'resolution','Resolution',15,12,'Resolved but required a follow-up email.'),
 (1,'policy_compliance','Policy Compliance',15,10,'Missed one disclosure step.'),
 (1,'ownership','Ownership',10,9,'Took ownership of the delay.'),
 (1,'professionalism','Professionalism',5,5,'Professional throughout.'),
 (1,'closing','Closing',5,1,'Rushed close, no confirmation of satisfaction.');

INSERT INTO coaching_sessions (evaluation_id, employee_id, coach_id, coaching_date, reason, action_plan, follow_up_date, status) VALUES
 (1, 5, 3, CURDATE(), 'Policy compliance score below target on the last 2 evaluations.', 'Review the return-policy disclosure checklist together and shadow 2 calls this week.', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'pending');
