-- Realistic Listening Test Data (Manual Import from ListenAMinute)
DELETE FROM questions WHERE module = 'listening';
DELETE FROM listening_tests;

INSERT INTO listening_tests (id, title, audio_url, transcript, difficulty, time_limit) VALUES 
(1, 'Advertising', 'https://listenaminute.com/a/advertising.mp3', 
'What is advertising? Is it telling the truth or is it making things look better than they really are? Or is it lying? Companies pay a lot of money for adverts. Some of the ads you see in glossy magazines look like art. The commercials on TV look like mini movies. Do they really change our behaviour? Do adverts make you buy things? I think some advertising is a form of lying. Is BMW really "The ultimate driving machine" like they say in their ads? British Airways used to say they were "The world''s favourite airline," but had to stop saying it because it wasn''t true. Personally, I get tired of watching ads on television. They always interrupt a good programme. I like ads in magazines. They''re usually quite interesting.', 'easy', 5);

INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES
(1, 'listening', 'mcq', 'What do companies pay a lot of money for?', '["Art", "Adverts", "Magazines"]', 'Adverts', 'The speaker says companies pay a lot of money for adverts.', 1),
(1, 'listening', 'mcq', 'How do commercials on TV look?', '["Like mini movies", "Like art", "Like lying"]', 'Like mini movies', 'The speaker mentions commercials on TV look like mini movies.', 2),
(1, 'listening', 'fill_blank', 'Complete the sentence: Is it telling the ________?', NULL, 'truth', 'Is it telling the truth or is it making things look better...', 3),
(1, 'listening', 'fill_blank', 'Some of the ads you see in glossy ________ look like art.', NULL, 'magazines', 'ads you see in glossy magazines look like art.', 4),
(1, 'listening', 'fill_blank', 'Do they really change our ________?', NULL, 'behaviour', 'Do they really change our behaviour?', 5),
(1, 'listening', 'mcq', 'What does the speaker think some advertising is a form of?', '["Art", "Truth", "Lying"]', 'Lying', 'I think some advertising is a form of lying.', 6),
(1, 'listening', 'matching', 'Which company said they were "The ultimate driving machine"?', '["British Airways", "BMW", "Ford"]', 'BMW', 'Is BMW really "The ultimate driving machine"...', 7),
(1, 'listening', 'fill_blank', 'British Airways had to stop saying their slogan because it wasn''t ________.', NULL, 'true', 'had to stop saying it because it wasn''t true.', 8),
(1, 'listening', 'mcq', 'What does the speaker get tired of watching?', '["TV programmes", "Glossy magazines", "Ads on television"]', 'Ads on television', 'Personally, I get tired of watching ads on television.', 9),
(1, 'listening', 'fill_blank', 'Ads on television always interrupt a good ________.', NULL, 'programme', 'They always interrupt a good programme.', 10);
