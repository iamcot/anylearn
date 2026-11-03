-- Self registrations used to get role 'user', which no rule reads (tiers, point expiry and wallet rules read 'member').
-- Decision of the owner (2026-11-03): turn them into members, except accounts that look created by a bot
-- (not a Vietnamese mobile, or a one-word generated name like "FOBGDAdlCASpcaOT", same rules as SignupRules).
-- Those keep 'user' so the team can find, lock or remove them (scripts/suspect_bot_signups.sql).
UPDATE users
SET role = 'member'
WHERE role = 'user'
  AND phone REGEXP '^0[35789][0-9]{8}$'
  AND NOT (name NOT LIKE '% %'
           AND CHAR_LENGTH(name) >= 10
           AND (name COLLATE utf8mb4_bin) REGEXP '^.(.*[A-Z]){4}');
