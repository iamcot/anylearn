package com.anylearn.backend.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.fun.FunAccessSettings;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Keeps a Vui học game closed to people outside its trial group (plan 14, phase 8). A call with no login is left to the controller. */
@Component
@RequiredArgsConstructor
public class FunAccessInterceptor implements HandlerInterceptor {

    private final FunAccessSettings access;
    private final ObjectMapper mapper;

    static String gameOf(String path) {
        if (path.startsWith("/api/quiz")) return "quiz";
        if (path.startsWith("/api/stickers")) return "sticker";
        if (path.startsWith("/api/explore")) return "explore";
        if (path.startsWith("/api/fun/checkin")) return "checkin";
        return null;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String game = gameOf(request.getRequestURI().replaceFirst("^/v2", ""));
        if (game == null) return true;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) return true;
        if (access.allowed(game, user)) return true;
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(mapper.writeValueAsString(ApiResponse.fail("Tính năng này đang thử nghiệm với một nhóm nhỏ, bạn sẽ được dùng sớm thôi!")));
        return false;
    }
}
