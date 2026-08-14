-- Fix labels: Remove "Cambridge" branding from listening and writing tests
-- Also fix Cookery Classes audio URL (was coffee.mp3, should be cooking.mp3)

-- ============ LISTENING TESTS ============

-- Fix Cookery Classes: wrong audio + Cambridge label
UPDATE listening_tests 
SET title = 'Cookery Classes', 
    audio_url = 'https://listenaminute.com/c/cooking.mp3' 
WHERE title LIKE '%Cookery Classes%';

-- Fix Crime Report Form: Cambridge label
UPDATE listening_tests 
SET title = 'Crime Report Form' 
WHERE title LIKE '%Crime Report Form%';

-- Fix Advertising test if it still has old label
UPDATE listening_tests 
SET title = 'Advertising' 
WHERE title LIKE '%Advertising%' AND title != 'Advertising';

-- Fix any other Cambridge IELTS prefixed listening tests
UPDATE listening_tests 
SET title = REPLACE(title, 'Cambridge IELTS 14 - ', '') 
WHERE title LIKE 'Cambridge IELTS 14 -%';

UPDATE listening_tests 
SET title = REPLACE(title, 'Cambridge IELTS 13 - ', '') 
WHERE title LIKE 'Cambridge IELTS 13 -%';

UPDATE listening_tests 
SET title = REPLACE(title, 'Cambridge IELTS 9 - ', '') 
WHERE title LIKE 'Cambridge IELTS 9 -%';

-- ============ WRITING PROMPTS ============

-- Remove "Cambridge " prefix from all writing categories
UPDATE writing_prompts 
SET category = REPLACE(category, 'Cambridge Academic', 'Academic') 
WHERE category LIKE 'Cambridge Academic%';
