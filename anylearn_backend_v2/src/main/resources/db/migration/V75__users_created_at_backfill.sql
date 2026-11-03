-- Self registrations (POST /api/register) never wrote users.created_at, so the back office showed no "Ngày tạo".
-- Since V70 every registration also writes user_acquisition, whose created_at is the moment of the sign-up:
-- copy it into the accounts that have no date. Only empty dates are filled.
UPDATE users u
JOIN user_acquisition a ON a.user_id = u.id
SET u.created_at = a.created_at,
    u.updated_at = COALESCE(u.updated_at, a.created_at)
WHERE u.created_at IS NULL;
