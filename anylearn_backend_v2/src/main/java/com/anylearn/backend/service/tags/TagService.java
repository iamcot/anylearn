package com.anylearn.backend.service.tags;

import com.anylearn.backend.entity.Tag;
import com.anylearn.backend.entity.TagGroups;
import com.anylearn.backend.repository.TagRepository;
import com.anylearn.backend.service.MeilisearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/** The tag dictionary and the tags of each course. Only the back office changes the dictionary. */
@Service
@RequiredArgsConstructor
public class TagService {

    private static final int SUGGESTION_LIMIT = 30;

    private final TagRepository tags;
    private final MeilisearchService meilisearch;

    public List<Map<String, Object>> listForAdmin(String group, String q) {
        String search = q == null || q.isBlank() ? null : q.trim();
        return tags.findForAdmin(group == null || group.isBlank() ? null : group, search);
    }

    public List<Tag> tagsOfItem(Long itemId) {
        return tags.findByItemId(itemId);
    }

    public List<String> activeNamesOfItem(Long itemId) {
        return tags.findActiveNamesByItemId(itemId);
    }

    /** What the search box suggests: tags in use, most used first. */
    public List<String> suggestions(String q) {
        String search = q == null || q.isBlank() ? null : q.trim();
        return tags.findUsedNames(search, SUGGESTION_LIMIT);
    }

    /** Creates the tag, or returns the one that already has the same name (ignoring accents and case). */
    @Transactional
    public Tag create(String rawName, String group) {
        String name = requireName(rawName);
        return TagRules.findSameName(tags.findAll(), name, null).orElseGet(() -> {
            Tag tag = new Tag();
            tag.setName(name);
            tag.setTagGroup(requireGroup(group));
            tag.setCreatedAt(LocalDateTime.now());
            tag.setUpdatedAt(LocalDateTime.now());
            return tags.save(tag);
        });
    }

    @Transactional
    public Tag update(Long id, String rawName, String group, Byte status, Integer sortOrder) {
        Tag tag = tags.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tag"));
        if (rawName != null) {
            String name = requireName(rawName);
            if (TagRules.findSameName(tags.findAll(), name, id).isPresent())
                throw new IllegalArgumentException("Đã có tag tên \"" + name + "\". Hãy dùng chức năng gộp tag.");
            tag.setName(name);
        }
        if (group != null) tag.setTagGroup(requireGroup(group));
        if (status != null) tag.setStatus(status);
        if (sortOrder != null) tag.setSortOrder(sortOrder);
        tag.setUpdatedAt(LocalDateTime.now());
        Tag saved = tags.save(tag);
        reindexItemsOf(id);
        return saved;
    }

    /** Moves every course of `fromId` to `intoId` and deletes `fromId`. */
    @Transactional
    public void merge(Long fromId, Long intoId) {
        if (fromId.equals(intoId)) throw new IllegalArgumentException("Không thể gộp tag vào chính nó");
        if (!tags.existsById(fromId) || !tags.existsById(intoId)) throw new IllegalArgumentException("Không tìm thấy tag");
        List<Long> itemIds = tags.findItemIdsByTagId(fromId);
        tags.copyLinks(fromId, intoId);
        tags.deleteLinksOfTag(fromId);
        tags.deleteById(fromId);
        itemIds.forEach(meilisearch::indexItem);
    }

    /** Replaces the tags of a course; ids that are not in the dictionary are ignored. */
    @Transactional
    public void setItemTags(Long itemId, List<Long> tagIds) {
        List<Long> wanted = new LinkedHashSet<>(tagIds).stream().toList();
        List<Long> known = wanted.isEmpty() ? List.of() : tags.findByIds(wanted).stream().map(Tag::getId).toList();
        tags.deleteLinksOfItem(itemId);
        known.forEach(tagId -> tags.addLink(itemId, tagId));
    }

    private void reindexItemsOf(Long tagId) {
        tags.findItemIdsByTagId(tagId).forEach(meilisearch::indexItem);
    }

    private String requireName(String rawName) {
        String name = TagRules.cleanName(rawName);
        if (name == null) throw new IllegalArgumentException("Tên tag trống hoặc dài quá " + TagRules.MAX_NAME_LENGTH + " ký tự");
        return name;
    }

    private String requireGroup(String group) {
        if (group == null || group.isBlank()) return TagGroups.OTHER;
        if (!TagGroups.isValid(group)) throw new IllegalArgumentException("Nhóm tag không hợp lệ");
        return group;
    }
}
