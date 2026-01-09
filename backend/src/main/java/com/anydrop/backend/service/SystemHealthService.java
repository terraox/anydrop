package com.anydrop.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class SystemHealthService {

    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // CPU Usage (simplified - actual CPU monitoring requires more complex setup)
        double cpuUsage = getCpuUsage();
        
        // Memory Usage
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
        long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
        double memoryUsagePercent = (usedMemory * 100.0) / maxMemory;
        
        // Disk Usage (simplified - would need FileSystem access)
        double diskUsage = 42.0; // Placeholder
        
        // Uptime
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        long uptimeMillis = runtimeBean.getUptime();
        Duration uptime = Duration.ofMillis(uptimeMillis);
        String uptimeString = formatUptime(uptime);
        
        health.put("cpuUsage", Math.round(cpuUsage));
        health.put("memoryUsed", Math.round(memoryUsagePercent));
        health.put("diskUsage", diskUsage);
        health.put("uptime", uptimeString);
        health.put("apiLatency", "32ms"); // Placeholder
        
        return health;
    }

    public List<Map<String, Object>> getServiceStatus() {
        List<Map<String, Object>> services = new ArrayList<>();
        
        // API Server
        services.add(createServiceStatus("API Server", "healthy", "99.99%"));
        
        // Database
        services.add(createServiceStatus("Database", "healthy", "99.98%"));
        
        // File Storage
        services.add(createServiceStatus("File Storage", "healthy", "100%"));
        
        // WebSocket Server
        services.add(createServiceStatus("WebSocket Server", "healthy", "99.95%"));
        
        // Background Jobs
        services.add(createServiceStatus("Background Jobs", "healthy", "98.50%"));
        
        return services;
    }

    private Map<String, Object> createServiceStatus(String name, String status, String uptime) {
        Map<String, Object> service = new HashMap<>();
        service.put("name", name);
        service.put("status", status);
        service.put("uptime", uptime);
        return service;
    }

    private double getCpuUsage() {
        // Simplified CPU usage calculation
        // In production, you'd use OperatingSystemMXBean or a library like OSHI
        return 24.0; // Placeholder
    }

    private String formatUptime(Duration duration) {
        long days = duration.toDays();
        long hours = duration.toHours() % 24;
        return String.format("%d days, %d hours", days, hours);
    }
}
