-- Read only: accounts that look created by a bot (number that is not a Vietnamese mobile,
-- or a one-word name with many capitals). Review before doing anything; nothing is changed here.
SELECT u.id, u.name, u.phone, u.role, u.status, u.created_at,
       (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
       u.wallet_c
FROM users u
WHERE u.is_child = 0
  AND u.role IN ('user', 'member')
  AND (u.phone NOT REGEXP '^0[35789][0-9]{8}$'
       OR (u.name NOT LIKE '% %' AND CHAR_LENGTH(u.name) >= 10 AND (u.name COLLATE utf8mb4_bin) REGEXP '^.(.*[A-Z]){4}'))
ORDER BY u.id DESC;

-- After V76 the accounts still on role 'user' are the suspects V76 left alone:
SELECT COUNT(*) AS role_user FROM users WHERE role = 'user';
