package com.anylearn.backend.service.adminaccess;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class AdminPermissionsTest {

    private static final Set<String> REVIEWER = Set.of(AdminPermissions.CONTENT_REVIEW);

    @Test
    void reviewerOpensKhamPhaAndTheSocialQueue() {
        assertTrue(AdminPermissions.allowed(REVIEWER, "GET", "/admin/explore/posts"));
        assertTrue(AdminPermissions.allowed(REVIEWER, "PUT", "/admin/explore/posts/12/review"));
        assertTrue(AdminPermissions.allowed(REVIEWER, "PUT", "/admin/explore/comments/3/status"));
        assertTrue(AdminPermissions.allowed(REVIEWER, "POST", "/admin/social-queue"));
        assertTrue(AdminPermissions.allowed(REVIEWER, "GET", "/admin/tags"));
        assertTrue(AdminPermissions.allowed(REVIEWER, "GET", "/admin/badges"));
    }

    @Test
    void reviewerCannotOpenAnythingElse() {
        assertFalse(AdminPermissions.allowed(REVIEWER, "POST", "/admin/tags"));
        assertFalse(AdminPermissions.allowed(REVIEWER, "GET", "/admin/explore/settings"));
        assertFalse(AdminPermissions.allowed(REVIEWER, "PUT", "/admin/explore/creators/5"));
        assertFalse(AdminPermissions.allowed(REVIEWER, "GET", "/admin/orders"));
        assertFalse(AdminPermissions.allowed(REVIEWER, "GET", "/admin/users"));
        assertFalse(AdminPermissions.allowed(REVIEWER, "GET", "/admin/explore/postsX"));
        assertFalse(AdminPermissions.allowed(REVIEWER, "GET", "/admin/collections/5"));
        assertFalse(AdminPermissions.allowed(Set.of(), "GET", "/admin/explore/posts"));
        assertFalse(AdminPermissions.allowed(Set.of("unknown"), "GET", "/admin/explore/posts"));
    }
}
