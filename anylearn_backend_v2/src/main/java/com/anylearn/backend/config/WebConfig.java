package com.anylearn.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final FunAccessInterceptor funAccessInterceptor;
    private final AdminAccessInterceptor adminAccessInterceptor;

    public WebConfig(FunAccessInterceptor funAccessInterceptor, AdminAccessInterceptor adminAccessInterceptor) {
        this.funAccessInterceptor = funAccessInterceptor;
        this.adminAccessInterceptor = adminAccessInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(funAccessInterceptor).addPathPatterns("/api/quiz/**", "/api/stickers/**", "/api/explore/**", "/api/fun/checkin/**", "/api/fun/missions/**", "/api/arena/**");
        registry.addInterceptor(adminAccessInterceptor).addPathPatterns("/admin/**").excludePathPatterns("/admin/login", "/admin/zns/callback");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
