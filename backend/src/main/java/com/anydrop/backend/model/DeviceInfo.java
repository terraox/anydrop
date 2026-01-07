package com.anydrop.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceInfo {
    private String sessionId;
    private String name;
    private String model;
    private String type; // PHONE, DESKTOP
    private int batteryLevel;
    private String deviceIcon; // e.g., "Icons.smartphone" or just "mobile"

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        DeviceInfo that = (DeviceInfo) o;
        return Objects.equals(sessionId, that.sessionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sessionId);
    }
}
