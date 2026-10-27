package com.anylearn.backend.service.collections;

import com.anylearn.backend.entity.Collection;
import com.anylearn.backend.entity.Item;
import com.anylearn.backend.repository.CollectionRepository;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.ConfigService;
import com.anylearn.backend.service.search.ItemVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ConfigService configService;

    // ── Visitors ─────────────────────────────────────────────────────────────

    /** Active collections in season that still have a course to show: the cards of the home page. */
    public List<Map<String, Object>> listPublic(LocalDate today) {
        List<Map<String, Object>> cards = new ArrayList<>();
        for (Collection collection : collectionRepository.findAllByOrderBySortOrderAscIdAsc()) {
            if (!isShown(collection, today)) continue;
            int visible = visibleItemIds(collection.getId()).size();
            if (visible == 0) continue;
            Map<String, Object> card = summary(collection);
            card.put("itemCount", visible);
            cards.add(card);
        }
        return cards;
    }

    /** The shown collections that list this course (and where it is still open): "Khóa này thuộc bộ sưu tập" on the course page. */
    public List<Map<String, Object>> listForItem(Long itemId, LocalDate today) {
        List<Map<String, Object>> cards = new ArrayList<>();
        for (Collection collection : collectionRepository.findAllByOrderBySortOrderAscIdAsc()) {
            if (!isShown(collection, today)) continue;
            List<Long> visible = visibleItemIds(collection.getId());
            if (!visible.contains(itemId)) continue;
            Map<String, Object> card = summary(collection);
            card.put("itemCount", visible.size());
            cards.add(card);
        }
        return cards;
    }

    public Optional<Map<String, Object>> getPublic(String slug, LocalDate today) {
        return collectionRepository.findBySlug(slug).filter(collection -> isShown(collection, today)).map(collection -> {
            Map<String, Object> page = summary(collection);
            page.put("items", configService.getItemsByIds(visibleItemIds(collection.getId())));
            return page;
        });
    }

    private boolean isShown(Collection collection, LocalDate today) {
        return collection.getActive() != null && collection.getActive() == 1
                && CollectionRules.isInSeason(collection.getSeasonFrom(), collection.getSeasonTo(), today);
    }

    /** Courses a visitor can open: switched on, in the admin's order. */
    private List<Long> visibleItemIds(Long collectionId) {
        List<Long> ids = collectionRepository.findItemIds(collectionId);
        Map<Long, Item> byId = itemRepository.findAllById(ids).stream().collect(Collectors.toMap(Item::getId, Function.identity()));
        Map<Long, com.anylearn.backend.entity.User> authors = userRepository.findAllById(
                byId.values().stream().map(Item::getUserId).distinct().toList()).stream()
                .collect(Collectors.toMap(com.anylearn.backend.entity.User::getId, Function.identity()));
        return ids.stream().filter(id -> byId.containsKey(id) && isLive(byId.get(id), authors.get(byId.get(id).getUserId()))).toList();
    }

    private static boolean isLive(Item item, com.anylearn.backend.entity.User author) {
        return author != null && ItemVisibility.isVisible(item.getStatus(), item.getUserStatus(), author.getStatus(), author.getIsSigned());
    }

    private Map<String, Object> summary(Collection collection) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", collection.getId());
        map.put("slug", collection.getSlug());
        map.put("title", collection.getTitle());
        map.put("subtitle", collection.getSubtitle());
        map.put("cover", collection.getCover());
        return map;
    }

    // ── Back office ──────────────────────────────────────────────────────────

    public List<Map<String, Object>> listForAdmin() {
        Map<Long, Long> counts = collectionRepository.countItems().stream()
                .collect(Collectors.toMap(c -> c.getCollectionId(), c -> c.getItemCount()));
        return collectionRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(collection -> {
            Map<String, Object> row = adminFields(collection);
            row.put("itemCount", counts.getOrDefault(collection.getId(), 0L));
            return row;
        }).toList();
    }

    public Optional<Map<String, Object>> getForAdmin(Long id) {
        return collectionRepository.findById(id).map(collection -> {
            Map<String, Object> map = adminFields(collection);
            map.put("items", configService.getItemsByIds(collectionRepository.findItemIds(id)));
            return map;
        });
    }

    private Map<String, Object> adminFields(Collection collection) {
        Map<String, Object> map = summary(collection);
        map.put("seasonFrom", collection.getSeasonFrom() != null ? collection.getSeasonFrom().toString() : null);
        map.put("seasonTo", collection.getSeasonTo() != null ? collection.getSeasonTo().toString() : null);
        map.put("sortOrder", collection.getSortOrder());
        map.put("active", collection.getActive() != null && collection.getActive() == 1);
        return map;
    }

    /** What an admin sends for one collection. `itemIds` replaces the list; its order is the order shown. */
    public record Draft(String title, String slug, String subtitle, String cover, LocalDate seasonFrom, LocalDate seasonTo,
                        Integer sortOrder, Boolean active, List<Long> itemIds) {}

    @Transactional
    public Collection save(Long id, Draft draft) {
        String title = draft.title() == null ? "" : draft.title().trim();
        if (title.isEmpty()) throw new IllegalArgumentException("Thiếu tên bộ sưu tập");
        String slug = draft.slug() == null || draft.slug().isBlank() ? CollectionRules.slugOf(title) : draft.slug().trim();
        if (!CollectionRules.isValidSlug(slug)) throw new IllegalArgumentException("Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang");
        if (draft.seasonFrom() != null && draft.seasonTo() != null && draft.seasonTo().isBefore(draft.seasonFrom())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        collectionRepository.findBySlug(slug).filter(other -> !other.getId().equals(id)).ifPresent(other -> {
            throw new IllegalArgumentException("Đường dẫn \"" + slug + "\" đã dùng cho bộ sưu tập khác");
        });

        Collection collection = id == null ? new Collection()
                : collectionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ sưu tập"));
        collection.setTitle(title);
        collection.setSlug(slug);
        collection.setSubtitle(blankToNull(draft.subtitle()));
        collection.setCover(blankToNull(draft.cover()));
        collection.setSeasonFrom(draft.seasonFrom());
        collection.setSeasonTo(draft.seasonTo());
        if (draft.sortOrder() != null) collection.setSortOrder(draft.sortOrder());
        if (draft.active() != null) collection.setActive((byte) (draft.active() ? 1 : 0));
        collection = collectionRepository.save(collection);

        if (draft.itemIds() != null) replaceItems(collection.getId(), draft.itemIds());
        return collection;
    }

    private void replaceItems(Long collectionId, List<Long> itemIds) {
        List<Long> requested = CollectionRules.distinctInOrder(itemIds);
        var existing = itemRepository.findAllById(requested).stream().map(Item::getId).collect(Collectors.toSet());
        List<Long> distinct = requested.stream().filter(existing::contains).toList();
        collectionRepository.deleteItems(collectionId);
        for (int position = 0; position < distinct.size(); position++) {
            collectionRepository.addItem(collectionId, distinct.get(position), position);
        }
    }

    @Transactional
    public void delete(Long id) {
        collectionRepository.deleteItems(id);
        collectionRepository.deleteById(id);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
