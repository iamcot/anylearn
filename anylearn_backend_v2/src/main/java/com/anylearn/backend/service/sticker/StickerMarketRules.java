package com.anylearn.backend.service.sticker;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Pure rules of the sticker market (plan 15, part B): "I have a, b, c and need x". A listing offers up to {@link #MAX_OFFERED}
 * duplicates of the rarity of the wanted sticker; the offered copies are locked while it is open ({@link StickerRules#tradableCopies(int, int, int)}).
 */
public final class StickerMarketRules {

    public static final int MAX_OFFERED = 3;

    private StickerMarketRules() {}

    /** What is wrong with a new listing, or null. {@code tradable} is per sticker, already minus copies in other listings. */
    public static String createProblem(List<Long> give, long want, Map<Long, String> rarityOf, Map<Long, Integer> tradable,
                                       int wantOwnedQty, int openListings, int maxListings) {
        if (give == null || give.isEmpty()) return "Chọn ít nhất 1 sticker trùng để đưa ra";
        if (give.size() > MAX_OFFERED) return "Chỉ đưa ra tối đa " + MAX_OFFERED + " sticker mỗi tin";
        if (new HashSet<>(give).size() != give.size()) return "Mỗi sticker chỉ chọn một lần";
        if (openListings >= maxListings) return "Bạn đang có " + maxListings + " tin trên chợ, hãy gỡ bớt trước khi đăng thêm";
        String wantRarity = rarityOf.get(want);
        if (wantRarity == null) return "Sticker muốn nhận không hợp lệ";
        if (wantOwnedQty > 0) return "Bạn đã có sticker muốn nhận rồi";
        for (long id : give) {
            if (id == want) return "Sticker đưa ra và sticker muốn nhận phải khác nhau";
            String rarity = rarityOf.get(id);
            if (rarity == null) return "Sticker không hợp lệ";
            if (!rarity.equals(wantRarity)) return "Chỉ đổi sticker cùng độ hiếm";
            if (tradable.getOrDefault(id, 0) < 1) return "Bạn không có sticker trùng này để đổi (đã rao hoặc đang bị khóa)";
        }
        return null;
    }

    /** What is wrong when someone presses "Đổi", or null. */
    public static String takeProblem(long lister, long taker, boolean open, boolean expired, List<Long> offered, long chosen,
                                     int takerOwnedChosen, int takerTradableWanted) {
        if (lister == taker) return "Đây là tin của bạn";
        if (!open) return "Tin này đã đóng";
        if (expired) return "Tin này đã hết hạn";
        if (!offered.contains(chosen)) return "Sticker này không có trong tin";
        if (takerOwnedChosen > 0) return "Bạn đã có sticker này rồi";
        if (takerTradableWanted < 1) return "Bạn không có sticker trùng mà người đăng đang cần";
        return null;
    }

    /** The offered stickers the viewer lacks. */
    public static List<Long> lackingOf(List<Long> offered, Map<Long, Integer> viewerOwned) {
        return offered.stream().filter(id -> viewerOwned.getOrDefault(id, 0) < 1).toList();
    }

    /** "Có cái tôi cần": the lister offers something the viewer lacks, and wants something the viewer can give. */
    public static boolean matches(List<Long> offered, long want, Map<Long, Integer> viewerOwned, Map<Long, Integer> viewerTradable) {
        return !lackingOf(offered, viewerOwned).isEmpty() && viewerTradable.getOrDefault(want, 0) >= 1;
    }

    /** The viewer can press "Đổi" on a listing: it matches and the viewer is not the lister. */
    public static boolean canTake(long lister, long viewer, List<Long> offered, long want, Map<Long, Integer> viewerOwned, Map<Long, Integer> viewerTradable) {
        return lister != viewer && matches(offered, want, viewerOwned, viewerTradable);
    }

    public static LocalDateTime expiresAt(LocalDateTime now, int days) {
        return now.plusDays(Math.max(days, 1));
    }

    public static boolean isExpired(LocalDateTime expiresAt, LocalDateTime now) {
        return expiresAt != null && !expiresAt.isAfter(now);
    }

    /** Distinct ids, keeping the order. */
    public static List<Long> distinct(List<Long> ids) {
        return List.copyOf(new LinkedHashSet<>(ids));
    }
}
