-- Vui học (plan 14): wipe the PLAYERS' game data so you can test from zero. DEV ONLY, never run on production.
-- Wipes: check-ins and streaks, Leo Xu wallets and ledger, game events, sticker collections, grants, offers, trades,
--        welcome packs, set rewards, device ids, risk flags, referral events.
-- Keeps: sticker definitions (sticker_defs), the question bank (quiz_*), every setting (configurations), users, anyPoint and orders.
--
-- Everyone:        mysql -u root anylearn < scripts/reset_fun_data.sql
-- One person only: set @only_user below to the user id (SELECT id FROM users WHERE phone = '09...').

SET @only_user = NULL;

START TRANSACTION;

DELETE FROM fun_checkins        WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM fun_coin_ledger     WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM fun_wallets         WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM game_events         WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM user_stickers       WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM sticker_grants      WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM sticker_offers      WHERE @only_user IS NULL OR from_user = @only_user OR to_user = @only_user;
DELETE FROM sticker_trades      WHERE @only_user IS NULL OR a_user = @only_user OR b_user = @only_user;
DELETE FROM sticker_set_rewards WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM welcome_packs       WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM device_ids          WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM risk_flags          WHERE @only_user IS NULL OR user_id = @only_user;
DELETE FROM referral_events     WHERE @only_user IS NULL OR new_user_id = @only_user OR referrer_id = @only_user;

-- the bell entries of the sticker game
DELETE FROM notifications WHERE type IN ('sticker_offer') AND (@only_user IS NULL OR user_id = @only_user);

COMMIT;

SELECT 'fun_checkins' AS tbl, COUNT(*) AS rows_left FROM fun_checkins
UNION ALL SELECT 'fun_wallets', COUNT(*) FROM fun_wallets
UNION ALL SELECT 'game_events', COUNT(*) FROM game_events
UNION ALL SELECT 'user_stickers', COUNT(*) FROM user_stickers
UNION ALL SELECT 'sticker_offers', COUNT(*) FROM sticker_offers;
