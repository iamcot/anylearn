package com.anylearn.backend.config;

import com.anylearn.backend.security.ApiTokenFilter;
import com.anylearn.backend.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final ApiTokenFilter apiTokenFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public auth endpoints
                .requestMatchers(HttpMethod.GET,  "/api/login", "/api/logout").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/login", "/api/login/facebook", "/api/login/apple").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/register", "/api/simple-register").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/password/otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/password/reset", "/api/otp/check").permitAll()
                // Public content
                .requestMatchers(HttpMethod.GET,  "/api/users/**", "/api/user/profile/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/event/**", "/api/search", "/api/search-tags", "/api/search/users").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/config/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/voucher/check").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/pdp/**", "/api/foundation", "/api/doc/**", "/api/helpcenter/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/item/*/reviews").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/article/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/ask/list", "/api/ask/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/report/ecommerce").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/social/profile/**", "/api/social/post/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/user/*/items").permitAll()
                // Public v3
                .requestMatchers(HttpMethod.GET,  "/api/v3/map", "/api/v3/home", "/api/v3/listing").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/v3/search", "/api/v3/partner/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/v3/main-subtypes/**", "/api/v3/articles").permitAll()
                // Open API (partner integration)
                .requestMatchers("/api/open/**").permitAll()
                // Payment gateway callbacks (called by external gateways, no auth)
                .requestMatchers("/payment-notify/**", "/payment-return/**").permitAll()
                // Payment bank info (public config)
                .requestMatchers(HttpMethod.GET, "/api/payment/bank-info").permitAll()
                // Admin login (public — role check is inside the controller)
                .requestMatchers(HttpMethod.POST, "/admin/login").permitAll()
                // Admin ZNS OAuth callback (browser redirect from Zalo, no JWT possible)
                .requestMatchers(HttpMethod.GET, "/admin/zns/callback").permitAll()
                // Everything else requires auth
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(apiTokenFilter, JwtFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
