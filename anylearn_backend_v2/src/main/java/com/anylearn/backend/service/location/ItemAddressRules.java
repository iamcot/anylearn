package com.anylearn.backend.service.location;

import java.util.List;
import java.util.Set;

/** Which courses need an address of their partner, and which address a class gets when the person did not choose. */
public final class ItemAddressRules {

    // Taught online, sold as a code, or recorded: no place to go to.
    private static final Set<String> NO_PLACE_FORMATS = Set.of("online", "digital", "video");

    /** `id` is the address to use; `problem` is the message to show when none can be chosen. */
    public record Decision(Long id, String problem) {
        public boolean ok() { return id != null; }
    }

    private ItemAddressRules() {}

    /** A partner of type "app" never has a place; otherwise it depends on how the course is taught. */
    public static boolean requiresAddress(String subtype, String partnerType) {
        if ("app".equals(partnerType)) return false;
        return subtype != null && !subtype.isBlank() && !NO_PLACE_FORMATS.contains(subtype);
    }

    /** The chosen address when it is one of the partner's; the only address when there is one; else a problem. */
    public static Decision resolve(List<Long> partnerAddressIds, Long chosen, String what) {
        if (partnerAddressIds.isEmpty()) return new Decision(null, "Đối tác chưa có địa chỉ. Hãy cập nhật địa chỉ của đối tác trước khi lưu.");
        if (chosen != null && partnerAddressIds.contains(chosen)) return new Decision(chosen, null);
        if (partnerAddressIds.size() == 1) return new Decision(partnerAddressIds.get(0), null);
        return new Decision(null, "Chọn địa chỉ áp dụng cho " + what + ".");
    }

    /** Several addresses ticked for a new class: all must belong to the partner; none ticked falls back to {@link #resolve}. */
    public static List<Long> chosenForNewClass(List<Long> partnerAddressIds, List<Long> ticked) {
        List<Long> valid = ticked.stream().filter(partnerAddressIds::contains).distinct().toList();
        if (!valid.isEmpty()) return valid;
        Decision auto = resolve(partnerAddressIds, null, "ca học");
        if (!auto.ok()) throw new IllegalArgumentException(auto.problem());
        return List.of(auto.id());
    }
}
