package com.anylearn.backend.service.sticker;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Pure rules of the sticker game (plan 14, phase 3): rarity, weighted drops, trade limits, eligibility and the risk score. */
public final class StickerRules {

    public static final String COMMON = "common";
    public static final String RARE = "rare";
    public static final String EPIC = "epic";
    public static final List<String> RARITIES = List.of(COMMON, RARE, EPIC);

    private StickerRules() {}

    public static String cleanRarity(String raw) {
        String value = raw == null ? "" : raw.trim().toLowerCase();
        return RARITIES.contains(value) ? value : null;
    }

    public static String rarityLabel(String rarity) {
        return switch (rarity == null ? "" : rarity) {
            case RARE -> "Hiếm";
            case EPIC -> "Siêu hiếm";
            default -> "Thường";
        };
    }

    public record Weighted(long id, String rarity, int weight) {}

    /** Picks one by weight; {@code roll} is in [0,1). Weight 0 never drops; null when nothing can drop. */
    public static Weighted pickWeighted(List<Weighted> candidates, double roll) {
        long total = 0;
        for (Weighted c : candidates) total += Math.max(c.weight(), 0);
        if (total <= 0) return null;
        double target = Math.min(Math.max(roll, 0), 0.999999999) * total;
        long run = 0;
        for (Weighted c : candidates) {
            run += Math.max(c.weight(), 0);
            if (target < run) return c;
        }
        return null;
    }

    /** Welcome pack: never an epic, and a rare only when the pack allows it. */
    public static List<Weighted> welcomePool(List<Weighted> all, boolean allowRare) {
        List<Weighted> out = new ArrayList<>();
        for (Weighted c : all) {
            if (COMMON.equals(c.rarity()) || (allowRare && RARE.equals(c.rarity()))) out.add(c);
        }
        return out;
    }

    public static String pairKey(long a, long b) {
        return Math.min(a, b) + "-" + Math.max(a, b);
    }

    /** One for one, the same rarity, two different people. */
    public static String tradeProblem(long fromUser, long toUser, String giveRarity, String wantRarity) {
        if (fromUser == toUser) return "Không thể tự đổi với chính mình";
        if (giveRarity == null || wantRarity == null) return "Sticker không hợp lệ";
        if (!giveRarity.equals(wantRarity)) return "Chỉ đổi sticker cùng độ hiếm";
        return null;
    }

    public static boolean pairBlocked(LocalDateTime lastTrade, LocalDateTime now, int windowDays) {
        return lastTrade != null && Duration.between(lastTrade, now).toDays() < windowDays;
    }

    /** Copies beyond the first that may be traded: the first copy is the one on the album, locked copies stay. */
    public static int tradableCopies(int qty, int lockedCopies) {
        return Math.max(0, Math.min(qty - 1, qty - Math.max(lockedCopies, 0)));
    }

    /** Only accounts that really played may trade, receive the second part of the welcome pack and count as an invite. */
    public static boolean eligible(long accountAgeDays, int checkinDays, int minAgeDays, int minCheckins) {
        return accountAgeDays >= minAgeDays && checkinDays >= minCheckins;
    }

    public record Signals(int accountsOnSameDevice, int accountsOnSameIp24h, int siblingsOfInviter24h, boolean onlyTradesWithOne) {}

    public static int riskScore(Signals s) {
        int score = 0;
        if (s.accountsOnSameDevice() > 0) score += 40;
        if (s.accountsOnSameIp24h() > 1) score += 25;
        if (s.siblingsOfInviter24h() >= 3) score += 20;
        if (s.onlyTradesWithOne()) score += 15;
        return Math.min(score, 100);
    }

    public static List<String> riskReasons(Signals s) {
        List<String> reasons = new ArrayList<>();
        if (s.accountsOnSameDevice() > 0) reasons.add("Cùng thiết bị với " + s.accountsOnSameDevice() + " tài khoản khác");
        if (s.accountsOnSameIp24h() > 1) reasons.add(s.accountsOnSameIp24h() + " tài khoản cùng IP trong 24 giờ");
        if (s.siblingsOfInviter24h() >= 3) reasons.add(s.siblingsOfInviter24h() + " tài khoản cùng người mời đăng ký sát nhau");
        if (s.onlyTradesWithOne()) reasons.add("Chỉ đổi sticker với đúng một người");
        return reasons;
    }
}
