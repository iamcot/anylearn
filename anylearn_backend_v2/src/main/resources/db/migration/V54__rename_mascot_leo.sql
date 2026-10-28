-- The mascot is called Leo and the game currency Leo Xu (it was Ali / Ali Xu, too close to a large group's brand).
UPDATE sticker_defs SET name = REPLACE(name, 'Ali', 'Leo'), description = REPLACE(description, 'Ali', 'Leo');
UPDATE configurations SET `value` = 'Leo Xu' WHERE `key` = 'fun/coin_name' AND `value` = 'Ali Xu';
