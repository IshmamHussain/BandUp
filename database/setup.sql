-- =====================================================================
-- ONE-COMMAND DATABASE SETUP
-- Runs the full schema and then loads the seed content.
--
-- From the ielts-platform folder, run ONE of these:
--
--   XAMPP / root with no password:
--     mysql -u root < database/setup.sql
--
--   root WITH a password:
--     mysql -u root -p < database/setup.sql
--
-- Or, in phpMyAdmin: open the Import tab and choose this file.
--
-- Safe to run again: it drops and recreates the database each time,
-- so you always get a clean, fully-seeded starting point.
-- =====================================================================

DROP DATABASE IF EXISTS ielts_prep;

SOURCE schema.sql;
SOURCE seeds/seed.sql;
