package com.anylearn.backend.controller.admin;

import com.anylearn.backend.service.location.ItemAddressRules;
import com.anylearn.backend.service.search.ItemAttributeGaps;
import com.anylearn.backend.service.search.ItemSearchAttributes;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.*;
import com.anylearn.backend.service.MeilisearchService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/items")
@RequiredArgsConstructor
public class AdminItemController {

    private final ItemRepository itemRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final ItemScheduleRepository itemScheduleRepository;
    private final UserLocationRepository userLocationRepository;
    private final com.anylearn.backend.service.tags.TagService tagService;
    private final OrderDetailRepository orderDetailRepository;
    private final UserRepository userRepository;
    private final MeilisearchService meilisearchService;
    private final EntityManager em;

    private static final int GAP_LIST_LIMIT = 300;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @PostMapping
    public ApiResponse<?> create(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (body.get("title") == null || body.get("title").toString().isBlank())
            return ApiResponse.fail("Tiêu đề không được trống");

        var item = new Item();
        item.setTitle((String) body.get("title"));
        item.setType(body.getOrDefault("type", "class").toString());
        item.setSubtype(body.containsKey("subtype") ? (String) body.get("subtype") : null);
        item.setUserId(body.containsKey("userId") ? toNum(body.get("userId")).longValue() : user.getId());
        item.setItemCategoryId(body.containsKey("itemCategoryId") ? toNum(body.get("itemCategoryId")).intValue() : 1);
        item.setPrice(body.containsKey("price") ? toNum(body.get("price")).longValue() : 0L);
        item.setOrgPrice(body.containsKey("orgPrice") ? toNum(body.get("orgPrice")).longValue() : 0L);
        item.setStatus((byte) 0);
        item.setUserStatus((byte) 0);
        item.setIsHot((byte) 0);
        item.setBoostScore(0);
        item.setGotBonus((byte) 0);
        item.setIsTest((byte) 0);
        item.setNolimitTime("1");
        item.setAllowReRegister((byte) 0);
        item.setDateStart(LocalDate.now());
        item.setCreatedAt(LocalDateTime.now());

        var saved = itemRepository.save(item);
        meilisearchService.indexItem(saved.getId());
        return ApiResponse.ok(Map.of("id", saved.getId()));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    @GetMapping
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer userStatus,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "id") String sortBy) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        String safeSort = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        String safeSortCol = "popularityScore".equalsIgnoreCase(sortBy) ? "i.popularity_score" : "i.id";

        var sql = "SELECT i.id, i.title, i.price, i.org_price, i.status, i.user_status, i.is_hot, " +
                  "i.date_start, i.subtype, u.name AS ownerName, u.phone AS ownerPhone, " +
                  "(SELECT COUNT(DISTINCT od.user_id) FROM order_details od WHERE od.item_id = i.id) AS soldCount, " +
                  "i.popularity_score, " +
                  "(SELECT COUNT(*) FROM item_user_actions iua WHERE iua.item_id = i.id AND iua.type = 'fav' AND iua.value = '1') AS favCount, " +
                  "(SELECT AVG(CAST(iua2.value AS DECIMAL)) FROM item_user_actions iua2 WHERE iua2.item_id = i.id AND iua2.type = 'rating') AS avgRating " +
                  "FROM items i LEFT JOIN users u ON i.user_id = u.id WHERE i.is_test = 0" +
                  (status != null ? " AND i.status=" + status : "") +
                  (userStatus != null ? " AND i.user_status=" + userStatus : "") +
                  (categoryId != null ? " AND EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id AND ic.category_id=" + categoryId + ")" : "") +
                  (userId != null ? " AND i.user_id=" + userId : "") +
                  (q != null && !q.isBlank() ? " AND i.title LIKE '%" + q.replace("'","''") + "%'" : "") +
                  " ORDER BY " + safeSortCol + " " + safeSort + " LIMIT " + size + " OFFSET " + (long) page * size;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("title", r[1] != null ? r[1] : "");
            m.put("price", r[2]); m.put("orgPrice", r[3]);
            m.put("status", r[4]); m.put("userStatus", r[5]); m.put("isHot", r[6]);
            m.put("dateStart", r[7] != null ? r[7].toString() : "");
            m.put("subtype", r[8] != null ? r[8] : "");
            m.put("ownerName", r[9] != null ? r[9] : ""); m.put("ownerPhone", r[10] != null ? r[10] : "");
            m.put("soldCount", r[11]);
            m.put("popularityScore", r[12] != null ? r[12] : 0);
            m.put("favCount", r[13] != null ? r[13] : 0);
            m.put("avgRating", r[14] != null ? ((Number) r[14]).doubleValue() : null);
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", content, "total", buildTotal(status, userStatus, categoryId, userId, q), "page", page, "size", size));
    }

    private long buildTotal(Integer status, Integer userStatus, Long categoryId, Long userId, String q) {
        var sql = "SELECT COUNT(*) FROM items i WHERE i.is_test = 0" +
                  (status != null ? " AND i.status=" + status : "") +
                  (userStatus != null ? " AND i.user_status=" + userStatus : "") +
                  (categoryId != null ? " AND EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id AND ic.category_id=" + categoryId + ")" : "") +
                  (userId != null ? " AND i.user_id=" + userId : "") +
                  (q != null && !q.isBlank() ? " AND i.title LIKE '%" + q.replace("'","''") + "%'" : "");
        return ((Number) em.createNativeQuery(sql).getSingleResult()).longValue();
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    @GetMapping("/{id:\\d+}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id).map(item -> {
            var m = new LinkedHashMap<String, Object>();
            // basic
            m.put("id", item.getId()); m.put("title", item.getTitle());
            m.put("type", item.getType()); m.put("subtype", item.getSubtype());
            m.put("userId", item.getUserId());
            userRepository.findById(item.getUserId()).ifPresent(u -> {
                m.put("ownerName", u.getName()); m.put("ownerPhone", u.getPhone());
            });
            // pricing
            m.put("price", item.getPrice()); m.put("orgPrice", item.getOrgPrice());
            m.put("commissionRate", item.getCommissionRate());
            m.put("companyCommission", item.getCompanyCommission());
            // status & display
            m.put("status", item.getStatus()); m.put("userStatus", item.getUserStatus());
            m.put("isHot", item.getIsHot()); m.put("boostScore", item.getBoostScore());
            m.put("itemCategoryId", item.getItemCategoryId());
            // schedule
            m.put("dateStart", item.getDateStart() != null ? item.getDateStart().toString() : null);
            m.put("dateEnd", item.getDateEnd() != null ? item.getDateEnd().toString() : null);
            m.put("timeStart", item.getTimeStart()); m.put("timeEnd", item.getTimeEnd());
            m.put("nolimitTime", item.getNolimitTime());
            m.put("cycleType", item.getCycleType()); m.put("cycleAmount", item.getCycleAmount());
            m.put("locationType", item.getLocationType()); m.put("location", item.getLocation());
            m.put("userLocationId", item.getUserLocationId());
            m.put("gaps", gapsOf(item));
            m.put("addressRequired", addressRequired(item));
            m.put("partnerAddressCount", partnerAddressIds(item).size());
            // enrollment flags (note typo: activiy not activity)
            m.put("agesMin", item.getAgesMin()); m.put("agesMax", item.getAgesMax());
            m.put("seats", item.getSeats());
            m.put("allowReRegister", item.getAllowReRegister());
            m.put("activiyTrial", item.getActiviyTrial());
            m.put("activiyTest", item.getActiviyTest());
            m.put("activiyVisit", item.getActiviyVisit());
            m.put("activationSupport", item.getActivationSupport());
            m.put("tagIds", tagService.tagsOfItem(item.getId()).stream().map(com.anylearn.backend.entity.Tag::getId).toList());
            // content
            m.put("image", item.getImage());
            m.put("shortContent", item.getShortContent());
            m.put("content", item.getContent());
            // seo
            m.put("seoTitle", item.getSeoTitle());
            m.put("seoUrl", item.getSeoUrl());
            m.put("seoDesc", item.getSeoDesc());
            // meta
            m.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
            // stats
            m.put("soldCount", orderDetailRepository.countDistinctUserIdByItemId(id));
            // categories
            m.put("categories", itemCategoryRepository.findCategoriesByItemId(id));
            return ApiResponse.ok(m);
        }).orElse(ApiResponse.fail("Not found"));
    }

    // ── Missing search attributes ─────────────────────────────────────────────

    @GetMapping("/attribute-gaps")
    public ApiResponse<?> attributeGaps(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Integer> summary = new java.util.LinkedHashMap<>();
        ItemAttributeGaps.LABELS.keySet().forEach(key -> summary.put(key, 0));
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        int checked = 0;
        for (Item item : itemRepository.findAll()) {
            if (item.getStatus() == null || item.getStatus() != 1 || item.getUserStatus() == null || item.getUserStatus() != 1) continue;
            checked++;
            List<String> gaps = gapsOf(item);
            gaps.forEach(key -> summary.merge(key, 1, Integer::sum));
            if (!gaps.isEmpty() && rows.size() < GAP_LIST_LIMIT) {
                Map<String, Object> row = new java.util.LinkedHashMap<>();
                row.put("id", item.getId());
                row.put("title", item.getTitle());
                row.put("userId", item.getUserId());
                row.put("gaps", gaps);
                rows.add(row);
            }
        }
        return ApiResponse.ok(Map.of("checked", checked, "summary", summary, "labels", ItemAttributeGaps.LABELS, "items", rows));
    }

    private List<String> gapsOf(Item item) {
        var schedules = itemScheduleRepository.findByItemIdAndStatus(item.getId(), (byte) 1);
        var branches = ItemSearchAttributes.activeBranchesOf(item, schedules, userLocationRepository::findAllById);
        String partnerType = userRepository.findById(item.getUserId()).map(User::getPartnerType).orElse(null);
        return ItemAttributeGaps.of(item, new ItemAttributeGaps.Facts(
                itemCategoryRepository.findAllCategoryUrlsByItemId(item.getId()).size(),
                tagService.tagsOfItem(item.getId()).size(),
                (int) schedules.stream().filter(s -> s.getTimeStart() != null && !s.getTimeStart().isBlank()).count(),
                (int) branches.stream().filter(b -> b.getLat() != null && b.getLng() != null).count(),
                partnerType != null, "app".equals(partnerType)));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @PutMapping("/{id:\\d+}")
    public ApiResponse<?> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id).map(item -> {
            if (body.containsKey("title")) item.setTitle((String) body.get("title"));
            if (body.containsKey("userId")) item.setUserId(toNum(body.get("userId")).longValue());
            if (body.containsKey("subtype")) item.setSubtype((String) body.get("subtype"));
            if (body.containsKey("price")) item.setPrice(toNum(body.get("price")).longValue());
            if (body.containsKey("orgPrice")) item.setOrgPrice(toNum(body.get("orgPrice")).longValue());
            if (body.containsKey("commissionRate")) item.setCommissionRate(body.get("commissionRate") == null ? null : toNum(body.get("commissionRate")).doubleValue());
            if (body.containsKey("companyCommission")) item.setCompanyCommission((String) body.get("companyCommission"));
            if (body.containsKey("status")) item.setStatus(toNum(body.get("status")).byteValue());
            if (body.containsKey("userStatus")) item.setUserStatus(toNum(body.get("userStatus")).byteValue());
            if (body.containsKey("isHot")) item.setIsHot(toNum(body.get("isHot")).byteValue());
            if (body.containsKey("boostScore")) item.setBoostScore(toNum(body.get("boostScore")).intValue());
            if (body.containsKey("itemCategoryId")) item.setItemCategoryId(toNum(body.get("itemCategoryId")).intValue());
            // schedule
            if (body.containsKey("dateStart") && body.get("dateStart") != null) item.setDateStart(LocalDate.parse((String) body.get("dateStart")));
            if (body.containsKey("dateEnd")) item.setDateEnd(body.get("dateEnd") == null ? null : LocalDate.parse((String) body.get("dateEnd")));
            if (body.containsKey("timeStart")) item.setTimeStart((String) body.get("timeStart"));
            if (body.containsKey("timeEnd")) item.setTimeEnd((String) body.get("timeEnd"));
            if (body.containsKey("nolimitTime")) item.setNolimitTime((String) body.get("nolimitTime"));
            if (body.containsKey("cycleType")) item.setCycleType((String) body.get("cycleType"));
            if (body.containsKey("cycleAmount")) item.setCycleAmount(body.get("cycleAmount") == null ? null : toNum(body.get("cycleAmount")).intValue());
            if (body.containsKey("locationType")) item.setLocationType((String) body.get("locationType"));
            if (body.containsKey("location")) item.setLocation((String) body.get("location"));
            if (body.containsKey("userLocationId")) item.setUserLocationId(body.get("userLocationId") == null ? null : toNum(body.get("userLocationId")).longValue());
            if (body.containsKey("agesMin")) item.setAgesMin(body.get("agesMin") == null ? null : toNum(body.get("agesMin")).byteValue());
            if (body.containsKey("agesMax")) item.setAgesMax(body.get("agesMax") == null ? null : toNum(body.get("agesMax")).byteValue());
            if (body.containsKey("seats")) item.setSeats(body.get("seats") == null ? null : toNum(body.get("seats")).intValue());
            if (body.containsKey("allowReRegister")) item.setAllowReRegister(toNum(body.get("allowReRegister")).byteValue());
            if (body.containsKey("activiyTrial")) item.setActiviyTrial(body.get("activiyTrial") == null ? null : toNum(body.get("activiyTrial")).byteValue());
            if (body.containsKey("activiyTest")) item.setActiviyTest(body.get("activiyTest") == null ? null : toNum(body.get("activiyTest")).byteValue());
            if (body.containsKey("activiyVisit")) item.setActiviyVisit(body.get("activiyVisit") == null ? null : toNum(body.get("activiyVisit")).byteValue());
            if (body.containsKey("activationSupport")) item.setActivationSupport((String) body.get("activationSupport"));
            // content
            if (body.containsKey("image")) item.setImage((String) body.get("image"));
            if (body.containsKey("shortContent")) item.setShortContent((String) body.get("shortContent"));
            if (body.containsKey("content")) item.setContent((String) body.get("content"));
            if (body.containsKey("seoTitle")) item.setSeoTitle((String) body.get("seoTitle"));
            if (body.containsKey("seoUrl")) item.setSeoUrl((String) body.get("seoUrl"));
            if (body.containsKey("seoDesc")) item.setSeoDesc((String) body.get("seoDesc"));
            String addressProblem = applyAddressRules(item);
            if (addressProblem != null) return ApiResponse.fail(addressProblem);
            itemRepository.save(item);
            if (body.get("tagIds") instanceof java.util.List<?> tagIds)
                tagService.setItemTags(id, tagIds.stream().filter(Number.class::isInstance).map(n -> ((Number) n).longValue()).toList());
            meilisearchService.indexItem(id);
            return ApiResponse.ok(item);
        }).orElse(ApiResponse.fail("Not found"));
    }

    // ── Quick status actions ──────────────────────────────────────────────────

    @PutMapping("/{id:\\d+}/approve")
    public ApiResponse<?> approve(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id).map(item -> {
            item.setUserStatus((byte) 1);
            itemRepository.save(item);
            meilisearchService.indexItem(id);
            return ApiResponse.ok("Approved");
        }).orElse(ApiResponse.fail("Not found"));
    }

    @PutMapping("/{id:\\d+}/toggle-hot")
    public ApiResponse<?> toggleHot(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id).map(item -> {
            item.setIsHot((byte) (item.getIsHot() == 1 ? 0 : 1));
            itemRepository.save(item);
            meilisearchService.indexItem(id);
            return ApiResponse.ok(Map.of("isHot", item.getIsHot()));
        }).orElse(ApiResponse.fail("Not found"));
    }

    // ── Categories ────────────────────────────────────────────────────────────

    @Transactional
    @PutMapping("/{id:\\d+}/categories")
    public ApiResponse<?> updateCategories(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        @SuppressWarnings("unchecked")
        var categoryIds = (List<Number>) body.get("categoryIds");
        if (categoryIds == null) return ApiResponse.fail("categoryIds required");

        // delete existing
        em.createNativeQuery("DELETE FROM items_categories WHERE item_id = ?1").setParameter(1, id).executeUpdate();
        // insert new
        categoryIds.forEach(catId ->
            em.createNativeQuery("INSERT INTO items_categories (item_id, category_id) VALUES (?1, ?2)")
              .setParameter(1, id).setParameter(2, catId.longValue()).executeUpdate()
        );
        return ApiResponse.ok(itemCategoryRepository.findCategoriesByItemId(id));
    }

    // ── Students ─────────────────────────────────────────────────────────────

    @GetMapping("/{id:\\d+}/students")
    public ApiResponse<?> students(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT u.id, u.name, u.phone, u.is_child, " +
                "parent.name AS parentName, parent.phone AS parentPhone, " +
                "od.paid_price, od.status, od.created_at " +
                "FROM order_details od " +
                "JOIN users u ON od.user_id = u.id " +
                "LEFT JOIN users parent ON u.is_child = 1 AND parent.id = u.user_id " +
                "WHERE od.item_id = ?1 ORDER BY od.id DESC LIMIT ?2 OFFSET ?3")
                .setParameter(1, id).setParameter(2, size).setParameter(3, (long) page * size)
                .getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("userId", r[0]); m.put("name", r[1] != null ? r[1] : "");
            boolean isChild = r[3] != null && ((Number) r[3]).intValue() == 1;
            if (isChild && r[4] != null) {
                m.put("phone", r[5] != null ? r[5] : "");
                m.put("parentName", r[4]); m.put("parentPhone", r[5] != null ? r[5] : "");
            } else {
                m.put("phone", r[2] != null ? r[2] : "");
            }
            m.put("isChild", isChild);
            m.put("paidPrice", r[6]); m.put("status", r[7] != null ? r[7] : "");
            m.put("enrolledAt", r[8] != null ? r[8].toString() : "");
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", content, "total", orderDetailRepository.countDistinctUserIdByItemId(id)));
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    // All read/write uses item_user_actions (type='rating') — same table as PDP

    @GetMapping("/{id:\\d+}/reviews")
    public ApiResponse<?> reviews(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        var reviews = itemUserActionRepository.findReviewsByItemId(id);
        var result = reviews.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id",        r.get("id"));
            m.put("userId",    r.get("user_id"));
            m.put("userName",  r.get("user_name"));
            m.put("rating",    r.get("value"));
            m.put("comment",   r.get("extra_value"));
            m.put("createdAt", r.get("created_at") != null ? r.get("created_at").toString() : "");
            return m;
        }).toList();
        return ApiResponse.ok(result);
    }

    @PostMapping("/{id:\\d+}/reviews")
    public ApiResponse<?> createReview(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        int rating = toNum(body.get("rating")).intValue();
        String comment = body.get("comment") instanceof String s ? s : "";
        // Upsert: update if this user already reviewed this item
        var existing = itemUserActionRepository.findRatingByItemAndUser(id, user.getId());
        var action = existing.orElseGet(ItemUserAction::new);
        action.setItemId(id);
        action.setUserId(user.getId());
        action.setType("rating");
        action.setValue(String.valueOf(rating));
        action.setExtraValue(comment);
        action.setUpdatedAt(java.time.LocalDateTime.now());
        if (action.getCreatedAt() == null) action.setCreatedAt(java.time.LocalDateTime.now());
        var saved = itemUserActionRepository.save(action);
        itemRepository.findById(id).ifPresent(meilisearchService::updateItemPopularityScoreAsync);
        return ApiResponse.ok(Map.of("id", saved.getId()));
    }

    @DeleteMapping("/{id:\\d+}/reviews/{reviewId:\\d+}")
    public ApiResponse<?> deleteReview(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long reviewId) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        itemUserActionRepository.deleteById(reviewId);
        itemRepository.findById(id).ifPresent(meilisearchService::updateItemPopularityScoreAsync);
        return ApiResponse.ok("Deleted");
    }

    // ── Item Schedules CRUD ───────────────────────────────────────────────────

    @GetMapping("/{id:\\d+}/schedules")
    public ApiResponse<?> listSchedules(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(itemScheduleRepository.findByItemIdAndStatus(id, (byte) 1));
    }

    @PostMapping("/{id:\\d+}/schedules")
    public ApiResponse<?> createSchedule(@AuthenticationPrincipal User user,
                                         @PathVariable Long id,
                                         @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        var item = itemRepository.findById(id).orElse(null);
        if (item == null) return ApiResponse.fail("Not found");
        List<Long> addressIds = addressRequired(item) ? partnerAddressIds(item) : null;
        List<Long> places;
        try {
            places = addressIds == null ? java.util.Collections.singletonList(null) : ItemAddressRules.chosenForNewClass(addressIds, tickedAddresses(body));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
        // One class per ticked address: the same hours at another branch is another class.
        List<ItemSchedule> saved = new java.util.ArrayList<>();
        for (Long place : places) {
            ItemSchedule s = buildSchedule(body);
            if (addressIds != null) s.setUserLocationId(place);
            s.setItemId(id);
            s.setCreatedAt(LocalDateTime.now());
            s.setUpdatedAt(LocalDateTime.now());
            saved.add(itemScheduleRepository.save(s));
        }
        meilisearchService.indexItem(id);
        return ApiResponse.ok(saved);
    }

    @GetMapping("/{id:\\d+}/locations")
    public ApiResponse<?> partnerLocations(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemRepository.findById(id)
                .map(item -> ApiResponse.ok(userLocationRepository.findByUserIdAndStatus(item.getUserId(), (byte) 1).stream()
                        .map(l -> Map.of("id", l.getId(), "title", l.getTitle(), "address", l.getAddress(), "hasCoordinates", l.getLat() != null))
                        .toList()))
                .orElse(ApiResponse.fail("Not found"));
    }

    @PutMapping("/{id:\\d+}/schedules/{sid:\\d+}")
    public ApiResponse<?> updateSchedule(@AuthenticationPrincipal User user,
                                         @PathVariable Long id,
                                         @PathVariable Long sid,
                                         @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return itemScheduleRepository.findById(sid).map(s -> {
            if (!s.getItemId().equals(id)) return ApiResponse.fail("Not found");
            ItemSchedule updated = buildSchedule(body);
            var owner = itemRepository.findById(id).orElse(null);
            if (owner != null && addressRequired(owner)) {
                var place = ItemAddressRules.resolve(partnerAddressIds(owner), updated.getUserLocationId(), "ca học");
                if (!place.ok()) return ApiResponse.fail(place.problem());
                updated.setUserLocationId(place.id());
            }
            updated.setId(sid);
            updated.setItemId(id);
            updated.setCreatedAt(s.getCreatedAt());
            updated.setUpdatedAt(LocalDateTime.now());
            var result = ApiResponse.ok(itemScheduleRepository.save(updated));
            meilisearchService.indexItem(id);
            return result;
        }).orElse(ApiResponse.fail("Not found"));
    }

    @DeleteMapping("/{id:\\d+}/schedules/{sid:\\d+}")
    public ApiResponse<?> deleteSchedule(@AuthenticationPrincipal User user,
                                         @PathVariable Long id,
                                         @PathVariable Long sid) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        itemScheduleRepository.findById(sid).ifPresent(s -> {
            if (s.getItemId().equals(id)) { s.setStatus((byte) 0); itemScheduleRepository.save(s); }
        });
        meilisearchService.indexItem(id);
        return ApiResponse.ok("Deleted");
    }

    private ItemSchedule buildSchedule(Map<String, Object> body) {
        ItemSchedule s = new ItemSchedule();
        s.setTitle(str(body, "title"));
        s.setScheduleType(str(body, "scheduleType") != null ? str(body, "scheduleType") : "recurring");
        s.setWeekdays(str(body, "weekdays"));
        s.setTimeStart(str(body, "timeStart"));
        s.setTimeEnd(str(body, "timeEnd"));
        s.setLocationNote(str(body, "locationNote"));
        s.setMeetingUrl(str(body, "meetingUrl"));
        s.setMeetingId(str(body, "meetingId"));
        s.setMeetingPasscode(str(body, "meetingPasscode"));
        s.setGatherTime(str(body, "gatherTime"));
        s.setBringItems(str(body, "bringItems"));
        if (body.get("userLocationId") != null && !body.get("userLocationId").toString().isBlank())
            s.setUserLocationId(Long.parseLong(body.get("userLocationId").toString()));
        s.setStatus((byte) 1);
        if (body.get("eventDate") != null) s.setEventDate(LocalDate.parse(body.get("eventDate").toString()));
        if (body.get("dateStart") != null) s.setDateStart(LocalDate.parse(body.get("dateStart").toString()));
        if (body.get("dateEnd") != null) s.setDateEnd(LocalDate.parse(body.get("dateEnd").toString()));
        if (body.get("durationValue") != null) s.setDurationValue(Integer.parseInt(body.get("durationValue").toString()));
        s.setDurationUnit(str(body, "durationUnit"));
        return s;
    }

    // ── Address rules ─────────────────────────────────────────────────────────

    private List<Long> partnerAddressIds(Item item) {
        return userLocationRepository.findByUserIdAndStatus(item.getUserId(), (byte) 1).stream().map(l -> l.getId()).toList();
    }

    private boolean addressRequired(Item item) {
        String partnerType = userRepository.findById(item.getUserId()).map(User::getPartnerType).orElse(null);
        return ItemAddressRules.requiresAddress(item.getSubtype(), partnerType);
    }

    private static List<Long> tickedAddresses(Map<String, Object> body) {
        List<Long> ticked = new java.util.ArrayList<>();
        if (body.get("userLocationIds") instanceof List<?> list) list.forEach(v -> { if (v instanceof Number n) ticked.add(n.longValue()); });
        if (body.get("userLocationId") instanceof Number n) ticked.add(n.longValue());
        else if (body.get("userLocationId") instanceof String t && !t.isBlank()) ticked.add(Long.parseLong(t.trim()));
        return ticked;
    }

    /**
     * A course taught at a place must have an address: on the course when it has no classes, on every class otherwise.
     * One address of the partner is applied automatically; with several the person must choose. Null when fine.
     */
    private String applyAddressRules(Item item) {
        if (!addressRequired(item)) return null;
        List<Long> addressIds = partnerAddressIds(item);
        var classes = itemScheduleRepository.findByItemIdAndStatus(item.getId(), (byte) 1);
        if (classes.isEmpty()) {
            var place = ItemAddressRules.resolve(addressIds, item.getUserLocationId(), "khóa học");
            if (!place.ok()) return place.problem();
            item.setUserLocationId(place.id());
            return null;
        }
        for (ItemSchedule c : classes) {
            if (c.getUserLocationId() != null && addressIds.contains(c.getUserLocationId())) continue;
            var place = ItemAddressRules.resolve(addressIds, null, "ca học" + (c.getTitle() == null || c.getTitle().isBlank() ? "" : " \"" + c.getTitle() + "\""));
            if (!place.ok()) return place.problem();
            c.setUserLocationId(place.id());
            itemScheduleRepository.save(c);
        }
        return null;
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v != null && !v.toString().isBlank() ? v.toString() : null;
    }

    private Number toNum(Object v) {
        if (v == null) return 0;
        return v instanceof Number ? (Number) v : Double.parseDouble(v.toString());
    }
}
