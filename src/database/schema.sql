-- =====================================================
-- HR PORTAL SCHEMA (BACKWARD COMPATIBLE)
-- =====================================================

-- CREATE DATABASE IF NOT EXISTS hrportal;
-- USE hrportal;

-- =====================================================
-- USERS TABLE (NO BREAKING CHANGES)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'HR',

  two_factor_enabled TINYINT(1) DEFAULT 0,
  two_factor_secret VARCHAR(255),

  phone VARCHAR(20),
  department VARCHAR(100),
  designation VARCHAR(100),

  is_active TINYINT(1) DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CANDIDATES TABLE (ENUM VALUES PRESERVED)
-- =====================================================

CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,

  custom_first_name VARCHAR(100),
  custom_last_name VARCHAR(100),

  email_id VARCHAR(255),
  phone_number VARCHAR(20),

  skills TEXT,
  education TEXT,

  custom_current_employer VARCHAR(255),
  custom_overall_experience_years VARCHAR(50),
  custom_relevant_experience_years VARCHAR(50),
  custom_current_salary_lpa VARCHAR(50),
  custom_expected_salary_lpa VARCHAR(50),

  notice_period VARCHAR(50),
  position VARCHAR(255),

 status ENUM(
  'applied',
  'interview',
  'invitation_sent',
  'hold',
  'offered',
  'accepted',
  'rejected'
) NOT NULL DEFAULT 'applied';
 

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  updated_by INT,
  updated_by_id INT,
  updated_by_name VARCHAR(100),

  INDEX idx_candidates_email (email_id),
  INDEX idx_candidates_status (status)
);

-- =====================================================
-- INTERVIEWERS TABLE (UNCHANGED)
-- =====================================================

CREATE TABLE IF NOT EXISTS interviewers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  role VARCHAR(100),
  department VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INTERVIEWS TABLE (SAFE EXTENSION)
-- =====================================================

CREATE TABLE IF NOT EXISTS interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,

  scheduled_date DATETIME NOT NULL,

  interview_type ENUM('Technical','Non-Technical') NOT NULL,

  interviewer_name VARCHAR(100),
  interviewer_email VARCHAR(150),
  interviewer_role VARCHAR(100),
  interviewer_department VARCHAR(100),

  -- Teams (centralized, optional)
  meeting_type ENUM('teams') DEFAULT 'teams',
  meeting_link TEXT,
  organizer_email VARCHAR(255),

  status VARCHAR(30),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (candidate_id)
    REFERENCES candidates(id)
    ON DELETE CASCADE,

  INDEX idx_interviews_candidate (candidate_id),
  INDEX idx_interviews_date (scheduled_date)
);

-- =====================================================
-- CANDIDATE ACTIVITY LOGS (AUDIT SAFE)
-- =====================================================

CREATE TABLE IF NOT EXISTS candidate_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,

  activity_type VARCHAR(100),
  activity_description TEXT,

  created_by INT,
  created_by_name VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (candidate_id)
    REFERENCES candidates(id)
    ON DELETE CASCADE,

  INDEX idx_activity_candidate (candidate_id)
);

-- =====================================================
-- AI INTERVIEW STORAGE (NEW, NON-INTRUSIVE)
-- =====================================================

CREATE TABLE IF NOT EXISTS interview_storage (
  interview_id INT PRIMARY KEY,

  candidate_audio_gcs TEXT,
  interviewer_audio_gcs TEXT,

  raw_transcript_gcs TEXT,
  cleaned_transcript_gcs TEXT,

  scorecard_gcs TEXT,
  decision_gcs TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (interview_id)
    REFERENCES interviews(id)
    ON DELETE CASCADE
);

-- =====================================================
-- AI INTERVIEW SCORES (FOR PERFORMANCE CALCULATION)
-- =====================================================

CREATE TABLE IF NOT EXISTS interview_scores (
  interview_id INT PRIMARY KEY,

  technical_score INT,
  communication_score INT,
  problem_solving_score INT,
  confidence_score INT,

  final_score INT,

  decision ENUM('PASS','HOLD','FAIL'),
  ai_remarks TEXT,

  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (interview_id)
    REFERENCES interviews(id)
    ON DELETE CASCADE
);

-- =====================================================
-- PERFORMANCE INDEXES (SAFE)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_candidates_email_status
  ON candidates(email_id, status);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate_date
  ON interviews(candidate_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_scores_decision
  ON interview_scores(decision);


CREATE TABLE resume_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  resume_file_path VARCHAR(500),
  updated_by INT,
  updated_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidate_status_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  hr_id INT NOT NULL,
  status ENUM(
   'applied',
  'interview',
  'invitation_sent',
  'hold',
  'offered',
  'accepted',
  'rejected'
  ) NOT NULL;

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (hr_id) REFERENCES users(id)
);
