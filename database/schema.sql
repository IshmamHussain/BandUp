-- =====================================================================
-- IELTS Prep Platform - MVP Database Schema (MySQL 8 / MariaDB 10.6+)
-- Charset: utf8mb4 so Bangla text and IPA pronunciation symbols work.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ielts_prep
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ielts_prep;

-- ---------------------------------------------------------------------
-- Users & profiles
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NULL,
  supabase_id   VARCHAR(36)   UNIQUE DEFAULT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  target_band   DECIMAL(2,1)  NULL,          -- e.g. 7.5
  exam_date     DATE          NULL,
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE profiles (
  user_id               INT UNSIGNED PRIMARY KEY,
  avatar_url            VARCHAR(500) NULL,
  country               VARCHAR(80)  NULL,
  bio                   VARCHAR(500) NULL,
  current_band_estimate DECIMAL(2,1) NULL,
  study_streak          INT UNSIGNED NOT NULL DEFAULT 0,
  last_active_date      DATE         NULL,   -- used to maintain the streak
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Reading module
-- ---------------------------------------------------------------------
CREATE TABLE reading_tests (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  difficulty   ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  time_limit   SMALLINT UNSIGNED NOT NULL DEFAULT 60, -- minutes
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reading_passages (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  test_id      INT UNSIGNED NULL,
  title        VARCHAR(255) NOT NULL,
  body         MEDIUMTEXT   NOT NULL,
  passage_type ENUM('academic','general') NOT NULL DEFAULT 'academic',
  difficulty   ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  position     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  time_limit   SMALLINT UNSIGNED NOT NULL DEFAULT 20, -- minutes
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_passages_test
    FOREIGN KEY (test_id) REFERENCES reading_tests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Listening module
-- ---------------------------------------------------------------------
CREATE TABLE listening_tests (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  audio_url    VARCHAR(500) NOT NULL,
  transcript   MEDIUMTEXT   NOT NULL,
  difficulty   ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  time_limit   SMALLINT UNSIGNED NOT NULL DEFAULT 30, -- minutes
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE questions (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  passage_id         INT UNSIGNED NULL,           -- NULL if it's a listening question or standalone
  listening_test_id  INT UNSIGNED NULL,           -- NULL if it's a reading question or standalone
  module             ENUM('reading','listening','grammar') NOT NULL,
  question_type      ENUM('mcq','true_false_ng','fill_blank','matching') NOT NULL,
  question_text      TEXT NOT NULL,
  options_json       JSON NULL,                   -- ["option A", "option B", ...]
  correct_answer     VARCHAR(255) NOT NULL,
  explanation    TEXT NULL,                   -- shown after answering
  position       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_questions_passage
    FOREIGN KEY (passage_id) REFERENCES reading_passages(id) ON DELETE CASCADE,
  CONSTRAINT fk_questions_listening
    FOREIGN KEY (listening_test_id) REFERENCES listening_tests(id) ON DELETE CASCADE,
  INDEX idx_questions_passage (passage_id),
  INDEX idx_questions_listening (listening_test_id)
) ENGINE=InnoDB;

CREATE TABLE attempts (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  question_id  INT UNSIGNED NOT NULL,
  given_answer VARCHAR(255) NULL,
  is_correct   TINYINT(1)   NOT NULL,
  time_taken   SMALLINT UNSIGNED NULL,        -- seconds on this question
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempts_user_date (user_id, created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Vocabulary module
-- ---------------------------------------------------------------------
CREATE TABLE vocabulary (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word             VARCHAR(100) NOT NULL,
  meaning          TEXT         NOT NULL,
  synonyms         VARCHAR(500) NULL,          -- comma separated
  antonyms         VARCHAR(500) NULL,
  example_sentence TEXT         NULL,
  pronunciation    VARCHAR(120) NULL,          -- IPA, e.g. /prəˌnʌnsiˈeɪʃən/
  category         VARCHAR(60)  NOT NULL DEFAULT 'general',
  band_level       ENUM('6','7','8','9') NOT NULL DEFAULT '7',
  INDEX idx_vocab_category (category),
  INDEX idx_vocab_word (word)
) ENGINE=InnoDB;

CREATE TABLE user_vocabulary (
  user_id    INT UNSIGNED NOT NULL,
  vocab_id   INT UNSIGNED NOT NULL,
  status     ENUM('new','learning','mastered') NOT NULL DEFAULT 'new',
  bookmarked TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, vocab_id),
  CONSTRAINT fk_uv_user  FOREIGN KEY (user_id)  REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_uv_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Writing module (AI-evaluated)
-- ---------------------------------------------------------------------
CREATE TABLE writing_prompts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_type   ENUM('task1','task2') NOT NULL,
  prompt_text TEXT NOT NULL,
  category    VARCHAR(80) NULL,               -- e.g. education, environment
  chart_data  JSON NULL,                      -- Chart.js config for Task 1 visual prompts
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE writing_submissions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  prompt_id       INT UNSIGNED NULL,
  task_type       ENUM('task1','task2') NOT NULL DEFAULT 'task2',
  essay_text      MEDIUMTEXT NOT NULL,
  word_count      SMALLINT UNSIGNED NOT NULL,
  status          ENUM('draft','submitted','evaluated') NOT NULL DEFAULT 'draft',
  band_overall    DECIMAL(2,1) NULL,
  evaluation_json JSON NULL,                  -- full structured AI feedback
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ws_user   FOREIGN KEY (user_id)   REFERENCES users(id)           ON DELETE CASCADE,
  CONSTRAINT fk_ws_prompt FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE SET NULL,
  INDEX idx_ws_user (user_id, created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Progress & bookmarks
-- ---------------------------------------------------------------------
-- One row per user per module per day. Updated whenever activity happens,
-- so dashboard charts are a simple SELECT instead of heavy aggregation.
CREATE TABLE daily_progress (
  user_id             INT UNSIGNED NOT NULL,
  module              ENUM('reading','listening','writing','vocabulary','grammar','speaking') NOT NULL,
  progress_date       DATE NOT NULL,
  minutes_studied     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  questions_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  questions_correct   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, module, progress_date),
  CONSTRAINT fk_dp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bookmarks (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  item_type  ENUM('passage','vocabulary','writing_prompt','reading_test') NOT NULL,
  item_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bookmark (user_id, item_type, item_id),
  CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
