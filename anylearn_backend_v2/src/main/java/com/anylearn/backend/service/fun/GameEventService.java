package com.anylearn.backend.service.fun;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * One line in `game_events` for everything that happens in the games, so the back office page "Sự kiện game" sees it all.
 * Every game writes through here. A failed write is only logged: a game never breaks because the log did.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GameEventService {

    public static final String GAME_CHECKIN = "checkin";
    public static final String GAME_QUIZ = "quiz";
    public static final String GAME_STICKER = "sticker";
    public static final String GAME_EXPLORE = "explore";
    public static final String GAME_BANNER = "banner";
    public static final String GAME_REF = "ref";
    public static final String GAME_COIN = "coin";

    private final JdbcTemplate jdbc;

    public void record(Long userId, String game, String type, String detail, int points) {
        try {
            String text = detail == null ? null : (detail.length() > 500 ? detail.substring(0, 500) : detail);
            jdbc.update("INSERT INTO game_events (user_id, game, type, detail, points) VALUES (?, ?, ?, ?, ?)",
                    userId, game, type, text, points);
        } catch (Exception e) {
            log.warn("[game-event] {}/{} for user {} not saved: {}", game, type, userId, e.getMessage());
        }
    }
}
