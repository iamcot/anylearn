package com.anylearn.backend.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.adminaccess.AdminAccessService;
import com.anylearn.backend.service.adminaccess.AdminPermissions;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Back office by page (plan 19.A5): an admin passes; a member with a permission (e.g. "Duyệt nội dung") passes only on the
 * paths of that permission (AdminPermissions); anyone else is refused here. Controllers still check their own rule.
 */
@Component
@RequiredArgsConstructor
public class AdminAccessInterceptor implements HandlerInterceptor {

    private final AdminAccessService access;
    private final ObjectMapper mapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI().replaceFirst("^/v2", "");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // no login: the public admin paths (login, Zalo callback) answer by themselves; the others were refused by security
        if (auth == null || !(auth.getPrincipal() instanceof User user)) return true;
        if (AdminAccessService.isAdmin(user)) return true;
        if (user.getStatus() != null && user.getStatus() == 1 && AdminPermissions.allowed(access.permissions(user.getId()), request.getMethod(), path)) return true;
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(mapper.writeValueAsString(ApiResponse.fail("Forbidden: tài khoản này không có quyền vào trang này")));
        return false;
    }
}
