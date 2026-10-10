package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemCategory;
import com.anylearn.backend.entity.ItemReview;
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
    private final ItemReviewRepository itemReviewRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final MeilisearchService meilisearchService;
    private final EntityManager em;

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
            // enrollment flags (note typo: activiy not activity)
            m.put("agesMin", item.getAgesMin()); m.put("agesMax", item.getAgesMax());
            m.put("seats", item.getSeats());
            m.put("allowReRegister", item.getAllowReRegister());
            m.put("activiyTrial", item.getActiviyTrial());
            m.put("activiyTest", item.getActiviyTest());
            m.put("activiyVisit", item.getActiviyVisit());
            m.put("activationSupport", item.getActivationSupport());
            m.put("tags", item.getTags());
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
            if (body.containsKey("tags")) item.setTags((String) body.get("tags"));
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
            itemRepository.save(item);
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

    @GetMapping("/{id:\\d+}/reviews")
    public ApiResponse<?> reviews(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        var reviews = itemReviewRepository.findByItemIdOrderByCreatedAtDesc(id);
        var result = reviews.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r.getId()); m.put("userId", r.getUserId());
            m.put("rating", r.getRating()); m.put("comment", r.getComment());
            m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            userRepository.findById(r.getUserId()).ifPresent(u -> { m.put("userName", u.getName()); m.put("userPhone", u.getPhone()); });
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
        var review = new ItemReview();
        review.setItemId(id);
        review.setUserId(user.getId());
        review.setRating(toNum(body.get("rating")).doubleValue());
        review.setComment((String) body.get("comment"));
        return ApiResponse.ok(itemReviewRepository.save(review));
    }

    @DeleteMapping("/{id:\\d+}/reviews/{reviewId:\\d+}")
    public ApiResponse<?> deleteReview(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long reviewId) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        itemReviewRepository.deleteById(reviewId);
        return ApiResponse.ok("Deleted");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Number toNum(Object v) {
        if (v == null) return 0;
        return v instanceof Number ? (Number) v : Double.parseDouble(v.toString());
    }
}
