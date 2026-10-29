package com.anylearn.backend.security;

import com.anylearn.backend.service.studio.ApiKeyService;
import com.anylearn.backend.service.studio.StudioRules;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * A machine key in the `X-Api-Key` header (t2m, plan 19.A6) signs the call in as the key's account, only on the creator
 * routes of Khám phá and /api/studio/*. Anywhere else the header is ignored, so the call stays without a login.
 */
@Component
@RequiredArgsConstructor
public class ApiKeyFilter extends OncePerRequestFilter {

    private final ApiKeyService keys;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String key = request.getHeader(StudioRules.HEADER);
        if (key != null && SecurityContextHolder.getContext().getAuthentication() == null
                && StudioRules.keyMayCall(request.getRequestURI().replaceFirst("^/v2", ""))) {
            keys.authenticate(key.trim()).ifPresent(match -> {
                var auth = new UsernamePasswordAuthenticationToken(match.user(), null, List.of());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
                request.setAttribute(StudioRules.REQUEST_ATTRIBUTE, match.keyId());
            });
        }
        chain.doFilter(request, response);
    }
}
