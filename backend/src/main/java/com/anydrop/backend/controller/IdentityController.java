package com.anydrop.backend.controller;

import com.anydrop.backend.model.ServerSettings;
import com.anydrop.backend.repository.ServerSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Identity endpoint for subnet scanning discovery.
 * Returns server-level device information (not user-specific).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IdentityController {

    private final ServerSettingsRepository settingsRepository;

    @GetMapping("/identify")
    public ResponseEntity<Map<String, String>> identify() {
        Map<String, String> identity = new HashMap<>();

        // Get server-level device name/icon
        String deviceName = settingsRepository.findBySettingKey("device_name")
                .map(ServerSettings::getSettingValue)
                .orElse("AnyDrop-Server");
        String deviceIcon = settingsRepository.findBySettingKey("device_icon")
                .map(ServerSettings::getSettingValue)
                .orElse("laptop");

        identity.put("name", deviceName);
        identity.put("icon", deviceIcon);
        identity.put("type", "DESKTOP");
        identity.put("app", "AnyDrop");
        identity.put("version", "1.0.0");

        // Include ID for transfer routing - use device name as the identifier
        // This matches how the web frontend registers with the transfer WebSocket
        identity.put("id", deviceName);
        identity.put("deviceId", deviceName);

        return ResponseEntity.ok(identity);
    }
}
