package com.anydrop.backend.model;

import java.util.Objects;

public class DeviceInfo {
    private String id; // Persistent device ID (UUID)
    private String sessionId; // Current WebSocket session ID
    private String name;
    private String model;
    private String type; // PHONE, DESKTOP
    private int batteryLevel;
    private String deviceIcon; // e.g., "Icons.smartphone" or just "mobile"

    public DeviceInfo() {
    }

    public DeviceInfo(String id, String sessionId, String name, String model, String type, int batteryLevel,
            String deviceIcon) {
        this.id = id;
        this.sessionId = sessionId;
        this.name = name;
        this.model = model;
        this.type = type;
        this.batteryLevel = batteryLevel;
        this.deviceIcon = deviceIcon;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getBatteryLevel() {
        return batteryLevel;
    }

    public void setBatteryLevel(int batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    public String getDeviceIcon() {
        return deviceIcon;
    }

    public void setDeviceIcon(String deviceIcon) {
        this.deviceIcon = deviceIcon;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        DeviceInfo that = (DeviceInfo) o;
        // Primary identity is based on persistent ID if available, otherwise session
        if (id != null && that.id != null) {
            return Objects.equals(id, that.id);
        }
        return Objects.equals(sessionId, that.sessionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id != null ? id : sessionId);
    }
}
