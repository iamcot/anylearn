package com.anylearn.backend.service.quiz;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Numbers of the rank quiz game, rows `quiz/*` of the configurations table. Every one has a default, so the game works
 * without any row; the back office page for them comes with phase 5.
 */
@Component
public class QuizGameSettings {

    private final ConfigurationRepository configurationRepository;

    public QuizGameSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !"0".equals(read("quiz/game_enabled").orElse("1").trim());
    }

    /** Seconds to answer a question. */
    public int seconds() {
        return number("quiz/seconds", 20, 5, 120);
    }

    public int extraSeconds() {
        return number("quiz/extra_seconds", 15, 5, 60);
    }

    public List<Integer> rankStars() {
        return QuizProgress.parseStars(read("quiz/rank_stars").orElse(null));
    }

    /** Leo Xu given when a rank is reached. */
    public int rankRewardCoins() {
        return number("quiz/rank_reward_coins", 20, 0, 100000);
    }

    /** Drop chance after a question, in percent. */
    public double dropBasePercent() {
        return number("quiz/drop_base", 12, 0, 100);
    }

    public double dropPityStepPercent() {
        return number("quiz/drop_pity_step", 4, 0, 100);
    }

    public int dropPityMax() {
        return number("quiz/drop_pity_max", 12, 1, 1000);
    }

    public double dropWrongBonusPercent() {
        return number("quiz/drop_wrong_bonus", 8, 0, 100);
    }

    public int dropDailyCap() {
        return number("quiz/drop_daily_cap", 8, 0, 1000);
    }

    /** Right answers in a row that always give an item (0 = off). */
    public int streakEvery() {
        return number("quiz/streak_every", 3, 0, 100);
    }

    public int price(String item) {
        return number("quiz/price_" + item, QuizItems.DEFAULT_PRICE.getOrDefault(item, 20), 0, 1000000);
    }

    public int weight(String item) {
        return number("quiz/weight_" + item, QuizItems.DEFAULT_WEIGHT.getOrDefault(item, 0), 0, 1000);
    }

    /** Items a person can buy in one day. */
    public int buyDailyCap() {
        return number("quiz/buy_daily_cap", 5, 0, 1000);
    }

    /** Days a person does not see the same question again. */
    public int noRepeatDays() {
        return number("quiz/no_repeat_days", 30, 0, 365);
    }

    /** Answers a question needs before "ask the community" shows real shares instead of a simulation. */
    public int realVotesMin() {
        return number("quiz/real_votes_min", 30, 5, 10000);
    }

    private int number(String key, int fallback, int min, int max) {
        try {
            int value = Integer.parseInt(read(key).orElse(String.valueOf(fallback)).trim());
            return Math.min(Math.max(value, min), max);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private Optional<String> read(String key) {
        return configurationRepository.findByKey(key).map(Configuration::getValue).filter(v -> v != null && !v.isBlank());
    }
}
