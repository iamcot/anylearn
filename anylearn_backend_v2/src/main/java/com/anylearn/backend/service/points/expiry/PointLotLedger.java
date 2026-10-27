package com.anylearn.backend.service.points.expiry;

import com.anylearn.backend.service.points.expiry.PointExpiryRules.Lot;
import com.anylearn.backend.service.points.expiry.PointExpiryRules.Take;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Keeps the lots of points of members (`point_lots`). Called by {@link com.anylearn.backend.service.WalletService} inside
 * its transaction, with the user row already locked. wallet_c stays the balance; the lots only tell which points expire first.
 */
@Component
@RequiredArgsConstructor
public class PointLotLedger {

    private final JdbcTemplate jdbc;

    public void add(Long userId, long points, LocalDateTime earnedAt) {
        if (points <= 0) return;
        jdbc.update("INSERT INTO point_lots (user_id, points_earned, points_remaining, earned_at) VALUES (?, ?, ?, ?)",
                userId, points, points, Timestamp.valueOf(earnedAt));
    }

    /** Spends points from the lots that expire first. Points that no lot holds are ignored (the balance is still reduced by the caller). */
    public void spend(Long userId, long points) {
        if (points <= 0) return;
        List<Lot> lots = open(userId);
        for (Take take : PointExpiryRules.allocate(lots, points)) {
            jdbc.update("UPDATE point_lots SET points_remaining = points_remaining - ? WHERE id = ?", take.points(), take.lotId());
        }
    }

    public List<Lot> open(Long userId) {
        return jdbc.query("SELECT id, points_remaining, earned_at FROM point_lots WHERE user_id = ? AND points_remaining > 0 ORDER BY earned_at, id",
                (rs, i) -> new Lot(rs.getLong("id"), rs.getLong("points_remaining"), rs.getTimestamp("earned_at").toLocalDateTime().toLocalDate()),
                userId);
    }
}
