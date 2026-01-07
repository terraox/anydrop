package com.anydrop.backend.controller;

import com.anydrop.backend.service.DiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Identity endpoint for subnet scanning discovery.
 * When other devices scan the network, they call this endpoint
 * to verify that this server is an AnyDrop instance.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IdentityController {

    private final DiscoveryService discoveryService;

    @GetMapping("/identify")
    public ResponseEntity<Map<String, String>> identify() {
        Map<String, String> identity = new HashMap<>();
        identity.put("name", discoveryService.getDeviceName());
        identity.put("icon", discoveryService.getDeviceIcon());
        identity.put("type", "DESKTOP");
        identity.put("app", "AnyDrop");
        identity.put("version", "1.0.0");
        return ResponseEntity.ok(identity);
    }
}
