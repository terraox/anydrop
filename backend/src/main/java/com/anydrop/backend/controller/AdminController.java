package com.anydrop.backend.controller;

import com.anydrop.backend.model.*;
import com.anydrop.backend.service.AdminService;
import com.anydrop.backend.service.FileStorageService;
import com.anydrop.backend.service.SystemHealthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final SystemHealthService systemHealthService;
    private final FileStorageService fileStorageService;

    // ============ Dashboard ============
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/dashboard/activity")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivity() {
        // Dummy data for now
        List<Map<String, Object>> activity = List.of(
                Map.of("action", "New user registered", "user", "alice@example.com", "time", "2 min ago"),
                Map.of("action", "File transfer completed", "user", "bob@example.com", "time", "5 min ago"),
                Map.of("action", "Pro plan activated", "user", "charlie@example.com", "time", "15 min ago")
        );
        return ResponseEntity.ok(activity);
    }

    @GetMapping("/dashboard/transfers-chart")
    public ResponseEntity<List<Map<String, Object>>> getTransfersChart() {
        // Dummy chart data for last 7 days
        List<Map<String, Object>> chart = List.of(
                Map.of("name", "Mon", "files", 120),
                Map.of("name", "Tue", "files", 250),
                Map.of("name", "Wed", "files", 180),
                Map.of("name", "Thu", "files", 310),
                Map.of("name", "Fri", "files", 290),
                Map.of("name", "Sat", "files", 100),
                Map.of("name", "Sun", "files", 140)
        );
        return ResponseEntity.ok(chart);
    }

    // ============ Users ============
    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = adminService.getUsers(search, status, pageable);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<Map<String, String>> banUser(@PathVariable Long id) {
        adminService.banUser(id);
        return ResponseEntity.ok(Map.of("message", "User banned successfully"));
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<Map<String, String>> unbanUser(@PathVariable Long id) {
        adminService.unbanUser(id);
        return ResponseEntity.ok(Map.of("message", "User unbanned successfully"));
    }

    @GetMapping("/users/export")
    public void exportUsersToCSV(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"");

        Page<User> users = adminService.getUsers(null, null, Pageable.unpaged());

        try (PrintWriter writer = response.getWriter()) {
            writer.println("ID,Email,Username,Role,Plan");
            for (User user : users) {
                writer.printf("%d,%s,%s,%s,%s%n",
                        user.getId(),
                        user.getEmail(),
                        user.getUsername() != null ? user.getUsername() : "",
                        user.getRole(),
                        user.getPlan() != null ? user.getPlan().getName() : "N/A");
            }
        }
    }

    // ============ Files ============
    @GetMapping("/files/stats")
    public ResponseEntity<Map<String, Object>> getFileStats() {
        return ResponseEntity.ok(adminService.getFileStats());
    }

    @GetMapping("/files")
    public ResponseEntity<Page<HistoryItem>> getFiles(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getFileTransfers(search, pageable));
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable Long id) {
        adminService.deleteFile(id);
        return ResponseEntity.ok(Map.of("message", "File deleted"));
    }

    @GetMapping("/files/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        HistoryItem item = adminService.getHistoryItem(id);
        Resource resource = fileStorageService.loadFileAsResource(item.getStoredFilename());
        String contentType = item.getType() != null ? item.getType() : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + item.getFilename() + "\"")
                .body(resource);
    }

    // ============ Plans ============
    @GetMapping("/plans/config")
    public ResponseEntity<Map<String, Object>> getPlanConfigs() {
        return ResponseEntity.ok(adminService.getPlanConfigs());
    }

    @PutMapping("/plans/config")
    public ResponseEntity<Map<String, String>> updatePlanConfig(
            @RequestParam String planName,
            @RequestBody PlanConfig config) {
        adminService.updatePlanConfig(planName, config);
        return ResponseEntity.ok(Map.of("message", "Plan configuration updated"));
    }

    // ============ Coupons ============
    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(adminService.getAllCoupons());
    }

    @PostMapping("/coupons")
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(adminService.createCoupon(coupon));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Map<String, String>> deleteCoupon(@PathVariable Long id) {
        adminService.deleteCoupon(id);
        return ResponseEntity.ok(Map.of("message", "Coupon deleted"));
    }

    // ============ Transactions ============
    @GetMapping("/transactions/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        return ResponseEntity.ok(adminService.getTransactionStats());
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<Transaction>> getTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getTransactions(search, pageable));
    }

    // ============ System Health ============
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(systemHealthService.getSystemHealth());
    }

    @GetMapping("/health/services")
    public ResponseEntity<List<Map<String, Object>>> getServiceStatus() {
        return ResponseEntity.ok(systemHealthService.getServiceStatus());
    }
}
