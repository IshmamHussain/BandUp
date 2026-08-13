-- Fix orphan passages: create a reading_test for each passage missing a test_id
-- Run this once: mysql -u root ielts_prep < database/fix_orphan_passages.sql

-- For each orphan passage, insert a test and link them
-- This uses a cursor approach since MySQL doesn't support INSERT...RETURNING easily

DELIMITER $$

DROP PROCEDURE IF EXISTS fix_orphan_passages$$

CREATE PROCEDURE fix_orphan_passages()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE p_id INT;
  DECLARE p_title VARCHAR(255);
  DECLARE p_difficulty VARCHAR(10);
  DECLARE p_time_limit INT;
  DECLARE new_test_id INT;

  DECLARE cur CURSOR FOR
    SELECT id, title, difficulty, time_limit
    FROM reading_passages
    WHERE test_id IS NULL;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO p_id, p_title, p_difficulty, p_time_limit;
    IF done THEN
      LEAVE read_loop;
    END IF;

    INSERT INTO reading_tests (title, difficulty, time_limit) VALUES (p_title, p_difficulty, p_time_limit);
    SET new_test_id = LAST_INSERT_ID();
    UPDATE reading_passages SET test_id = new_test_id WHERE id = p_id;

    SELECT CONCAT('Linked passage ', p_id, ' "', p_title, '" → test ', new_test_id) AS status;
  END LOOP;

  CLOSE cur;
END$$

DELIMITER ;

CALL fix_orphan_passages();
DROP PROCEDURE fix_orphan_passages;
