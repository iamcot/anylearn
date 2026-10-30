package com.anylearn.backend.service.adminaccess;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pure rules of back-office permissions for people who are not admins (plan 19.A5). An admin may do everything; a member
 * with a permission may sign in to the back office and call only the paths of that permission.
 */
public final class AdminPermissions {

    private AdminPermissions() {}

    /** "Duyệt nội dung": Khám phá posts and comments, and the social queue. No orders, money or members. */
    public static final String CONTENT_REVIEW = "content_review";
    public static final List<String> ALL = List.of(CONTENT_REVIEW);
    public static final Map<String, String> LABELS = Map.of(CONTENT_REVIEW, "Duyệt nội dung");

    private record Rule(String method, String prefix) {}

    /** Paths open to a permission ("*" = any method). Creator management and Khám phá settings stay with admins. */
    private static final Map<String, List<Rule>> RULES = Map.of(CONTENT_REVIEW, List.of(
            new Rule("*", "/admin/explore/posts"),
            new Rule("*", "/admin/explore/comments"),
            new Rule("*", "/admin/explore/users/"),
            new Rule("*", "/admin/explore/upload"),
            new Rule("*", "/admin/explore/video-upload"),
            new Rule("*", "/admin/social-queue"),
            new Rule("GET", "/admin/tags"),
            new Rule("GET", "/admin/collections/course-search"),
            new Rule("GET", "/admin/badges"),
            new Rule("GET", "/admin/me")
    ));

    /** Paths always closed to non-admins, even under an open prefix. */
    private static final List<String> ADMIN_ONLY = List.of("/admin/explore/settings", "/admin/explore/creators");

    public static boolean known(String permission) {
        return permission != null && ALL.contains(permission);
    }

    /** May a person with these permissions call `method path` (path without the /v2 context)? */
    public static boolean allowed(Set<String> permissions, String method, String path) {
        if (permissions == null || permissions.isEmpty() || path == null) return false;
        for (String closed : ADMIN_ONLY) if (path.startsWith(closed)) return false;
        for (String permission : permissions) {
            for (Rule rule : RULES.getOrDefault(permission, List.of())) {
                if (("*".equals(rule.method()) || rule.method().equalsIgnoreCase(method)) && matches(path, rule.prefix())) return true;
            }
        }
        return false;
    }

    private static boolean matches(String path, String prefix) {
        if (prefix.endsWith("/")) return path.startsWith(prefix);
        return path.equals(prefix) || path.startsWith(prefix + "/") || path.startsWith(prefix + "?");
    }
}
