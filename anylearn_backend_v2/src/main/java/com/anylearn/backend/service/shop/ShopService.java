package com.anylearn.backend.service.shop;

import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizGameService;
import com.anylearn.backend.service.quiz.QuizGameSettings;
import com.anylearn.backend.service.quiz.QuizItems;
import com.anylearn.backend.service.quiz.QuizPackService;
import com.anylearn.backend.service.quiz.QuizRules;
import com.anylearn.backend.service.sticker.StickerRules;
import com.anylearn.backend.service.sticker.StickerService;
import com.anylearn.backend.service.sticker.StickerSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;

/**
 * The Leo Xu shop (plan 15): one catalog for every screen that sells something, and the sell-back side. Quiz items are bought through
 * {@link QuizGameService#buy} (their prices stay `quiz/price_*`); everything else is priced by {@link ShopSettings}. All coin movement goes through
 * {@link CoinService}; every purchase and sale also writes `shop_log` (daily limits) and a line in `game_events`.
 */
@Service
@RequiredArgsConstructor
public class ShopService {

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final ShopSettings shop;
    private final QuizGameSettings quizSettings;
    private final QuizGameService quiz;
    private final QuizPackService packs;
    private final StickerService stickers;
    private final StickerSettings stickerSettings;
    private final CoinService coins;
    private final FunSettings funSettings;
    private final GameEventService events;

    private final Random random = new Random();

    private static final String QUIZ_LINK = "/fun/quiz";
    private static final String STICKER_LINK = "/fun/sticker";

    private void requireOpen() {
        if (!funSettings.enabled() || !shop.enabled()) throw new IllegalStateException("Cửa hàng Leo Xu đang tạm đóng");
    }

    private void requireOn(String key, String label) {
        if (!shop.on(key)) throw new IllegalStateException(label + " đang tạm ngừng bán");
    }

    private int usedToday(long userId, String kind) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM shop_log WHERE user_id = ? AND kind = ? AND created_at >= ?",
                Integer.class, userId, kind, Timestamp.valueOf(LocalDate.now(clock).atStartOfDay()));
        return n == null ? 0 : n;
    }

    private void log(long userId, String kind, String ref, int amount) {
        jdbc.update("INSERT INTO shop_log (user_id, kind, ref, coins) VALUES (?, ?, ?, ?)", userId, kind, ref, amount);
    }

    private void requireLeft(long userId, String kind, int cap, String what) {
        if (ShopRules.left(cap, usedToday(userId, kind)) <= 0) throw new IllegalStateException("Hôm nay bạn đã " + what + " đủ " + cap + " lần rồi, mai quay lại nhé");
    }

    private void charge(long userId, int price, String source, String detail) {
        if (!coins.debit(userId, price, source, detail)) {
            throw new IllegalStateException("Bạn chưa đủ " + funSettings.coinName() + " (cần " + price + ")");
        }
    }

    // ---------------------------------------------------------------- catalog

    private Map<String, Object> entry(String key, String game, String kind, String label, String description, Integer price, boolean on,
                                      Integer dailyCap, Integer left, String link, String linkLabel) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("game", game);
        m.put("gameLabel", "quiz".equals(game) ? "Leo rank" : "Sticker");
        m.put("kind", kind);
        m.put("label", label);
        m.put("description", description);
        m.put("price", price);
        m.put("enabled", on);
        m.put("dailyCap", dailyCap);
        m.put("left", left);
        m.put("link", link);
        m.put("linkLabel", linkLabel);
        return m;
    }

    private List<Map<String, Object>> catalog(long userId) {
        List<Map<String, Object>> out = new ArrayList<>();
        Map<String, Integer> owned = quiz.ownedItems(userId);
        int itemLeft = quiz.itemBuyLeft(userId);
        for (String item : QuizItems.ALL) {
            Map<String, Object> m = entry(item, "quiz", "item", QuizItems.LABELS.get(item),
                    QuizItems.BEFORE.contains(item) ? "Dùng trước một câu hỏi" : "Dùng trong một câu hỏi",
                    quizSettings.price(item), shop.on(item), quizSettings.buyDailyCap(), itemLeft, QUIZ_LINK, "Dùng ở Leo rank ›");
            m.put("qty", owned.getOrDefault(item, 0));
            m.put("stockCap", QuizItems.cap(item));
            out.add(m);
        }
        int packLeft = ShopRules.left(shop.n("pack_daily_cap"), usedToday(userId, ShopRules.LOG_PACK));
        int size = quizSettings.packSize();
        List<Integer> levelPrices = shop.levelPrices();
        Map<String, Object> level = entry(ShopRules.PACK_LEVEL, "quiz", "pack", "Gói theo cấp độ",
                size + " câu của một cấp, nhiều chủ đề. Không tốn năng lượng, không tính sao", null, shop.on(ShopRules.PACK_LEVEL),
                shop.n("pack_daily_cap"), packLeft, QUIZ_LINK, "Dùng ở Leo rank ›");
        level.put("needsDifficulty", true);
        level.put("levelPrices", levelPrices);
        out.add(level);
        out.add(entry(ShopRules.PACK_TOPIC, "quiz", "pack", "Gói theo chủ đề",
                size + " câu của một chủ đề, mọi cấp độ. Không tốn năng lượng, không tính sao", shop.n("pack_price_topic"), shop.on(ShopRules.PACK_TOPIC),
                shop.n("pack_daily_cap"), packLeft, QUIZ_LINK, "Dùng ở Leo rank ›"));
        Map<String, Object> both = entry(ShopRules.PACK_TOPIC_LEVEL, "quiz", "pack", "Gói chủ đề + cấp",
                size + " câu của một chủ đề ở một cấp. Không tốn năng lượng, không tính sao", null, shop.on(ShopRules.PACK_TOPIC_LEVEL),
                shop.n("pack_daily_cap"), packLeft, QUIZ_LINK, "Dùng ở Leo rank ›");
        both.put("needsDifficulty", true);
        both.put("levelPrices", levelPrices);
        out.add(both);
        out.add(entry(ShopRules.ENERGY, "quiz", "energy", "Nạp năng lượng", "Cộng " + shop.n("energy_amount") + " năng lượng cho Leo rank (không vượt mức tối đa)",
                shop.n("energy_price"), shop.on(ShopRules.ENERGY), shop.n("energy_daily_cap"),
                ShopRules.left(shop.n("energy_daily_cap"), usedToday(userId, ShopRules.LOG_ENERGY)), QUIZ_LINK, "Dùng ở Leo rank ›"));
        out.add(entry(ShopRules.CHEST_NORMAL, "sticker", "chest", "Rương sticker thường", "Mở ra 1 sticker ngẫu nhiên theo tỉ lệ rơi",
                shop.n("chest_normal_price"), shop.on(ShopRules.CHEST_NORMAL), shop.n("chest_normal_cap"),
                ShopRules.left(shop.n("chest_normal_cap"), usedToday(userId, ShopRules.LOG_CHEST_NORMAL)), STICKER_LINK, "Mở album ›"));
        out.add(entry(ShopRules.CHEST_RARE, "sticker", "chest", "Rương sticker hiếm", "Chắc chắn ra 1 sticker hiếm hoặc siêu hiếm",
                shop.n("chest_rare_price"), shop.on(ShopRules.CHEST_RARE), shop.n("chest_rare_cap"),
                ShopRules.left(shop.n("chest_rare_cap"), usedToday(userId, ShopRules.LOG_CHEST_RARE)), STICKER_LINK, "Mở album ›"));
        return out;
    }

    /** Everything the shop page needs for one person: the catalog with today's limits, what can be sold and the balance. */
    @Transactional
    public Map<String, Object> overview(long userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", funSettings.enabled() && shop.enabled());
        out.put("coinName", funSettings.coinName());
        out.put("coins", coins.balance(userId));
        out.put("items", catalog(userId));
        out.put("levelLabels", QuizRules.LEVEL_LABELS);
        out.put("sell", sellView(userId));
        out.put("energy", quiz.energyView(userId));
        return out;
    }

    private Map<String, Object> sellView(long userId) {
        Map<String, Object> sell = new LinkedHashMap<>();
        stickers.syncFromGrants(userId);
        List<Map<String, Object>> sellStickers = new ArrayList<>();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT d.id, d.name, d.emoji, d.image_url AS image, d.rarity, u.qty FROM user_stickers u JOIN sticker_defs d ON d.id = u.sticker_id " +
                "WHERE u.user_id = ? AND u.qty > 1 ORDER BY d.sort_order, d.id", userId);
        for (Map<String, Object> row : rows) {
            long id = ((Number) row.get("id")).longValue();
            int copies = stickers.tradable(userId, id);
            if (copies <= 0) continue;
            Map<String, Object> m = new LinkedHashMap<>(row);
            m.put("rarityLabel", StickerRules.rarityLabel(String.valueOf(row.get("rarity"))));
            m.put("sellable", copies);
            m.put("price", shop.stickerSellPrice(String.valueOf(row.get("rarity"))));
            sellStickers.add(m);
        }
        sell.put("stickers", sellStickers);
        List<Map<String, Object>> sellItems = new ArrayList<>();
        Map<String, Integer> owned = quiz.ownedItems(userId);
        for (String item : QuizItems.ALL) {
            int qty = owned.getOrDefault(item, 0);
            if (qty <= 0) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", item);
            m.put("label", QuizItems.LABELS.get(item));
            m.put("qty", qty);
            m.put("price", ShopRules.sellPrice(quizSettings.price(item), shop.n("sell_item_percent")));
            sellItems.add(m);
        }
        sell.put("items", sellItems);
        sell.put("stickerEnabled", shop.on("sell_sticker"));
        sell.put("itemEnabled", shop.on("sell_item"));
        sell.put("stickerLeft", ShopRules.left(shop.n("sell_sticker_cap"), usedToday(userId, ShopRules.LOG_SELL_STICKER)));
        sell.put("itemLeft", ShopRules.left(shop.n("sell_item_cap"), usedToday(userId, ShopRules.LOG_SELL_ITEM)));
        sell.put("stickerCap", shop.n("sell_sticker_cap"));
        sell.put("itemCap", shop.n("sell_item_cap"));
        return sell;
    }

    // ---------------------------------------------------------------- buying

    /** Buys one catalog entry. `difficulty` (1..5) is needed for a pack that depends on the level. */
    @Transactional
    public Map<String, Object> buy(long userId, String key, Integer difficulty) {
        requireOpen();
        if (key == null || key.isBlank()) throw new IllegalArgumentException("Chọn món cần mua");
        Map<String, Object> out = new LinkedHashMap<>();
        if (QuizItems.known(key)) {
            requireOn(key, QuizItems.LABELS.get(key));
            out.putAll(quiz.buy(userId, key));
            out.put("message", "Đã mua " + QuizItems.LABELS.get(key));
        } else if (ShopRules.isPackKey(key)) {
            requireOn(key, ShopSettings.switchLabel(key));
            buyPack(userId, key, difficulty, out);
        } else if (ShopRules.ENERGY.equals(key)) {
            requireOn(key, "Năng lượng");
            buyEnergy(userId, out);
        } else if (ShopRules.CHEST_NORMAL.equals(key) || ShopRules.CHEST_RARE.equals(key)) {
            requireOn(key, ShopSettings.switchLabel(key));
            buyChest(userId, ShopRules.CHEST_RARE.equals(key), out);
        } else {
            throw new IllegalArgumentException("Món này không có trong cửa hàng");
        }
        out.put("coins", coins.balance(userId));
        out.put("coinName", funSettings.coinName());
        return out;
    }

    private void buyPack(long userId, String key, Integer difficulty, Map<String, Object> out) {
        String type = ShopRules.packType(key);
        int price = ShopRules.packPrice(type, difficulty, shop.levelPrices(), shop.n("pack_price_topic"));
        requireLeft(userId, ShopRules.LOG_PACK, shop.n("pack_daily_cap"), "mua gói tập luyện");
        charge(userId, price, CoinService.SOURCE_SHOP_PACK, "Mua " + ShopRules.packLabel(type).toLowerCase());
        QuizPackService.Pack pack = packs.create(userId, type, difficulty, price);
        log(userId, ShopRules.LOG_PACK, String.valueOf(pack.id()), price);
        events.record(userId, GameEventService.GAME_QUIZ, "buy_pack", type + (pack.difficulty() == null ? "" : " d" + pack.difficulty()), -price);
        out.put("pack", packs.view(pack));
        out.put("message", "Đã mua " + ShopRules.packLabel(type).toLowerCase()
                + (pack.difficulty() == null ? "" : " cấp " + QuizRules.LEVEL_LABELS.get(pack.difficulty())) + ". Chọn chủ đề ở mục Gói tập luyện của Leo rank");
    }

    private void buyEnergy(long userId, Map<String, Object> out) {
        if (quiz.energyFull(userId)) throw new IllegalStateException("Năng lượng đang đầy rồi");
        requireLeft(userId, ShopRules.LOG_ENERGY, shop.n("energy_daily_cap"), "nạp năng lượng");
        int price = shop.n("energy_price");
        charge(userId, price, CoinService.SOURCE_SHOP_ENERGY, "Nạp năng lượng Leo rank");
        out.put("energy", quiz.addEnergy(userId, shop.n("energy_amount")));
        log(userId, ShopRules.LOG_ENERGY, null, price);
        events.record(userId, GameEventService.GAME_QUIZ, "buy_energy", String.valueOf(shop.n("energy_amount")), -price);
        out.put("message", "Đã nạp năng lượng");
    }

    private void buyChest(long userId, boolean rare, Map<String, Object> out) {
        if (!stickerSettings.enabled()) throw new IllegalStateException("Sticker đang tạm đóng");
        String kind = rare ? ShopRules.LOG_CHEST_RARE : ShopRules.LOG_CHEST_NORMAL;
        requireLeft(userId, kind, shop.n(rare ? "chest_rare_cap" : "chest_normal_cap"), "mua rương");
        int price = shop.n(rare ? "chest_rare_price" : "chest_normal_price");
        charge(userId, price, CoinService.SOURCE_SHOP_CHEST, rare ? "Mua rương sticker hiếm" : "Mua rương sticker thường");
        Map<String, Object> sticker;
        if (rare) {
            StickerRules.Weighted pick = StickerRules.pickWeighted(ShopRules.rareChestPool(stickers.pool()), random.nextDouble());
            if (pick == null) throw new IllegalStateException("Chưa có sticker hiếm để mở rương");
            stickers.grant(userId, pick.id(), "chest", "rare", null);
            sticker = stickers.view(pick.id());
        } else {
            sticker = stickers.dropRandom(userId, "chest", "normal");
            if (sticker == null) throw new IllegalStateException("Chưa có sticker để mở rương");
        }
        log(userId, kind, sticker == null ? null : String.valueOf(sticker.get("id")), price);
        events.record(userId, GameEventService.GAME_STICKER, "chest", (rare ? "rare " : "normal ") + sticker.get("name"), -price);
        out.put("sticker", sticker);
        out.put("message", "Rương mở ra: " + sticker.get("name"));
    }

    // ---------------------------------------------------------------- selling

    /** Sells one thing to Leo: `kind` = sticker (id of the sticker) or item (key of the quiz item). */
    @Transactional
    public Map<String, Object> sell(long userId, String kind, String id) {
        requireOpen();
        Map<String, Object> out = new LinkedHashMap<>();
        if ("sticker".equals(kind)) sellSticker(userId, id, out);
        else if ("item".equals(kind)) sellItem(userId, id, out);
        else throw new IllegalArgumentException("Chỉ bán được sticker trùng hoặc vật phẩm");
        out.put("coins", coins.balance(userId));
        out.put("coinName", funSettings.coinName());
        out.put("sell", sellView(userId));
        return out;
    }

    private void sellSticker(long userId, String id, Map<String, Object> out) {
        if (!shop.on("sell_sticker")) throw new IllegalStateException("Leo đang tạm không mua sticker");
        long stickerId;
        try {
            stickerId = Long.parseLong(id == null ? "" : id.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Sticker không hợp lệ");
        }
        Map<String, Object> def = stickers.view(stickerId);
        if (def == null) throw new IllegalArgumentException("Sticker không tồn tại");
        requireLeft(userId, ShopRules.LOG_SELL_STICKER, shop.n("sell_sticker_cap"), "bán sticker");
        stickers.syncFromGrants(userId);
        if (stickers.tradable(userId, stickerId) < 1) throw new IllegalStateException("Chỉ bán được bản trùng đang rảnh, Leo luôn để bạn giữ lại 1 bản");
        if (!stickers.takeOne(userId, stickerId, 1)) throw new IllegalStateException("Bạn không còn bản trùng nào của sticker này");
        int price = shop.stickerSellPrice(String.valueOf(def.get("rarity")));
        long before = coins.balance(userId);
        coins.credit(userId, price, CoinService.SOURCE_SHOP_SELL, "Bán sticker " + def.get("name") + " cho Leo");
        int paid = (int) (coins.balance(userId) - before);
        log(userId, ShopRules.LOG_SELL_STICKER, String.valueOf(stickerId), paid);
        events.record(userId, GameEventService.GAME_STICKER, "sell", String.valueOf(def.get("name")), paid);
        out.put("earned", paid);
        out.put("message", "Leo đã mua " + def.get("name") + " với " + paid + " " + funSettings.coinName());
    }

    private void sellItem(long userId, String item, Map<String, Object> out) {
        if (!shop.on("sell_item")) throw new IllegalStateException("Leo đang tạm không mua vật phẩm");
        if (!QuizItems.known(item)) throw new IllegalArgumentException("Vật phẩm không tồn tại");
        requireLeft(userId, ShopRules.LOG_SELL_ITEM, shop.n("sell_item_cap"), "bán vật phẩm");
        if (!quiz.sellItem(userId, item)) throw new IllegalStateException("Bạn không có " + QuizItems.LABELS.get(item) + " để bán");
        int price = ShopRules.sellPrice(quizSettings.price(item), shop.n("sell_item_percent"));
        long before = coins.balance(userId);
        coins.credit(userId, price, CoinService.SOURCE_SHOP_SELL, "Bán " + QuizItems.LABELS.get(item) + " cho Leo");
        int paid = (int) (coins.balance(userId) - before);
        log(userId, ShopRules.LOG_SELL_ITEM, item, paid);
        events.record(userId, GameEventService.GAME_QUIZ, "sell_item", item, paid);
        out.put("earned", paid);
        out.put("items", quiz.ownedItems(userId));
        out.put("message", "Leo đã mua " + QuizItems.LABELS.get(item) + " với " + paid + " " + funSettings.coinName());
    }
}
