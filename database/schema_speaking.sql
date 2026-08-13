USE ielts_prep;

CREATE TABLE IF NOT EXISTS speaking_prompts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  part        ENUM('part1','part2','part3') NOT NULL,
  prompt_text TEXT NOT NULL,
  category    VARCHAR(80) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS speaking_submissions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  prompt_id       INT UNSIGNED NULL,
  audio_url       VARCHAR(500) NOT NULL,
  duration_sec    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status          ENUM('draft','submitted','evaluated') NOT NULL DEFAULT 'draft',
  band_overall    DECIMAL(2,1) NULL,
  evaluation_json JSON NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ss_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ss_prompt FOREIGN KEY (prompt_id) REFERENCES speaking_prompts(id) ON DELETE SET NULL,
  INDEX idx_ss_user (user_id, created_at)
) ENGINE=InnoDB;

-- Seed some basic speaking prompts
INSERT INTO speaking_prompts (part, prompt_text, category) VALUES
('part2', 'Describe a book you have recently read. You should say: what kind of book it is, what it is about, what sort of people would enjoy it, and explain why you liked or disliked it.', 'Books and Literature'),
('part2', 'Describe a traditional food from your country. You should say: what it looks like, how it is made, when people usually eat it, and explain why you like it.', 'Food and Culture'),
('part2', 'Describe a person who has had a significant influence on your life. You should say: who this person is, how long you have known them, what they did to influence you, and explain why they are so important to you.', 'People');
