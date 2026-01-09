package com.anydrop.backend.controller;

import com.anydrop.backend.model.ServerSettings;
import com.anydrop.backend.repository.ServerSettingsRepository;
import com.anydrop.backend.service.DiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Device settings controller for managing device name/icon at server level
 */
@RestController
@RequestMapping("/api/device")
@RequiredArgsConstructor
public class DeviceSettingsController {

        private final ServerSettingsRepository settingsRepository;
        private final DiscoveryService discoveryService;

        @PutMapping("/name")
        public ResponseEntity<Map<String, String>> updateDeviceName(@RequestBody Map<String, String> request) {
                String newDeviceName = request.get("deviceName");
                String newDeviceIcon = request.getOrDefault("deviceIcon", "laptop");

                // Save to database as server-level settings
                ServerSettings nameSetting = settingsRepository.findBySettingKey("device_name")
                                .orElse(null);
                if (nameSetting == null) {
                        nameSetting = new ServerSettings();
                        nameSetting.setSettingKey("device_name");
                }
                nameSetting.setSettingValue(newDeviceName);
                settingsRepository.save(nameSetting);

                ServerSettings iconSetting = settingsRepository.findBySettingKey("device_icon")
                                .orElse(null);
                if (iconSetting == null) {
                        iconSetting = new ServerSettings();
                        iconSetting.setSettingKey("device_icon");
                }
                iconSetting.setSettingValue(newDeviceIcon);
                settingsRepository.save(iconSetting);

                // Update mDNS broadcast with new name
                discoveryService.updateDeviceIdentity(newDeviceName, newDeviceIcon);

                Map<String, String> response = new HashMap<>();
                response.put("message", "Device name updated successfully");
                response.put("deviceName", newDeviceName);
                return ResponseEntity.ok(response);
        }

        @GetMapping("/identity")
        public ResponseEntity<Map<String, String>> getDeviceIdentity() {
                String deviceName = settingsRepository.findBySettingKey("device_name")
                                .map(ServerSettings::getSettingValue)
                                .orElse("AnyDrop-Server");
                String deviceIcon = settingsRepository.findBySettingKey("device_icon")
                                .map(ServerSettings::getSettingValue)
                                .orElse("laptop");

                Map<String, String> identity = new HashMap<>();
                identity.put("deviceName", deviceName);
                identity.put("deviceIcon", deviceIcon);
                return ResponseEntity.ok(identity);
        }
}
