package com.anydrop.backend.config;

import com.anydrop.backend.socket.AnyDropHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class BinaryStreamConfig implements WebSocketConfigurer {

    private final AnyDropHandler anyDropHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(anyDropHandler, "/transfer")
                .setAllowedOriginPatterns("*");
    }
}
