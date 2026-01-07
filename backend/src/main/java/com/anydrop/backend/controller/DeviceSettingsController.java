package com.anydrop.backend.controller;

import com.anydrop.backend.model.User;
import com.anydrop.backend.repository.UserRepository;
import com.anydrop.backend.service.DiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Device settings controller for managing device name/icon
 */
@RestController
@RequestMapping("/api/device")
@RequiredArgsConstructor
public class DeviceSettingsController {

    private final UserRepository userRepository;
    private final DiscoveryService discoveryService;

    @PutMapping("/name")
    public ResponseEntity<Map<String, String>> updateDeviceName(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String email = authentication.getName();
        String newDeviceName = request.get("deviceName");
        String newDeviceIcon = request.getOrDefault("deviceIcon", "laptop");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDeviceName(newDeviceName);
        user.setDeviceIcon(newDeviceIcon);
        userRepository.save(user);

        // Update mDNS broadcast with new name
        discoveryService.updateDeviceIdentity(newDeviceName, newDeviceIcon);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Device name updated successfully");
        response.put("deviceName", newDeviceName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/identity")
    public ResponseEntity<Map<String, String>> getDeviceIdentity(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, String> identity = new HashMap<>();
        identity.put("deviceName", user.getDeviceName() != null ? user.getDeviceName() : user.getUsername());
        identity.put("deviceIcon", user.getDeviceIcon() != null ? user.getDeviceIcon() : "laptop");
        return ResponseEntity.ok(identity);
    }
}
