package com.anydrop.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration for flexible development
 * Allows frontend and backend to run on any port
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Use a custom CORS configuration source that dynamically allows localhost origins
        return new DynamicCorsConfigurationSource();
    }

    /**
     * Custom CORS configuration source that allows any localhost port
     * This enables flexible development without hardcoding ports
     */
    private static class DynamicCorsConfigurationSource implements CorsConfigurationSource {
        
        @Override
        public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
            CorsConfiguration configuration = new CorsConfiguration();
            
            String origin = request.getHeader("Origin");
            
            // Allow any localhost origin (any port) for development
            if (origin != null && (origin.startsWith("http://localhost:") || 
                                   origin.startsWith("https://localhost:") ||
                                   origin.startsWith("http://127.0.0.1:") ||
                                   origin.startsWith("https://127.0.0.1:") ||
                                   origin.startsWith("http://[::1]:") ||
                                   origin.startsWith("https://[::1]:"))) {
                configuration.setAllowedOrigins(List.of(origin));
                configuration.setAllowCredentials(true);
            } else {
                // For production or other origins, you can add specific allowed origins here
                // For now, we'll allow common development origins
                configuration.setAllowedOriginPatterns(Arrays.asList(
                    "http://localhost:*",
                    "https://localhost:*",
                    "http://127.0.0.1:*",
                    "https://127.0.0.1:*",
                    "http://[::1]:*",
                    "https://[::1]:*"
                ));
                configuration.setAllowCredentials(false);
            }

            configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
            configuration.setAllowedHeaders(Arrays.asList("*"));
            configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "Content-Length"));
            configuration.setMaxAge(3600L);

            return configuration;
        }
    }
}
