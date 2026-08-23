USE ielts_prep;

CREATE TABLE IF NOT EXISTS speaking_tests (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  category     VARCHAR(80) NULL,
  part1_prompt TEXT NOT NULL,
  part2_prompt TEXT NOT NULL,
  part3_prompt TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS speaking_submissions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  test_id         INT UNSIGNED NULL,
  audio_url       VARCHAR(500) NOT NULL,
  duration_sec    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status          ENUM('draft','submitted','evaluated') NOT NULL DEFAULT 'draft',
  band_overall    DECIMAL(2,1) NULL,
  evaluation_json JSON NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ss_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ss_test   FOREIGN KEY (test_id)   REFERENCES speaking_tests(id) ON DELETE SET NULL,
  INDEX idx_ss_user (user_id, created_at)
) ENGINE=InnoDB;


