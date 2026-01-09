package com.anydrop.backend.service;

import com.anydrop.backend.model.*;
import com.anydrop.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final HistoryRepository historyRepository;
    private final CouponRepository couponRepository;
    private final TransactionRepository transactionRepository;
    private final PlanConfigRepository planConfigRepository;
    private final FileStorageService fileStorageService;

    // Dashboard Stats
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findByAccountNonLocked(true, Pageable.unpaged()).getTotalElements();
        long activeTransfers = 0; // keeping dummy for now
        
        // Calculate storage used
        List<HistoryItem> allHistory = historyRepository.findAll();
        long totalStorageBytes = allHistory.stream()
            .mapToLong(HistoryItem::getSize)
            .sum();
        double totalStorageGB = totalStorageBytes / (1024.0 * 1024.0 * 1024.0);
        
        // Calculate bandwidth today
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        List<HistoryItem> todayHistory = historyRepository.findAll()
            .stream()
            .filter(h -> h.getCreatedAt().isAfter(todayStart))
            .toList();
        long bandwidthToday = todayHistory.stream()
            .mapToLong(HistoryItem::getSize)
            .sum();
        double bandwidthGB = bandwidthToday / (1024.0 * 1024.0 * 1024.0);
        
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("activeTransfers", activeTransfers);
        stats.put("storageUsedGB", String.format("%.2f", totalStorageGB));
        stats.put("bandwidthTodayGB", String.format("%.2f", bandwidthGB));
        
        return stats;
    }

    // Users Management
    public Page<User> getUsers(String search, String status, Pageable pageable) {
        boolean filterBanned = "banned".equalsIgnoreCase(status);
        boolean filterActive = "active".equalsIgnoreCase(status);

        if (search != null && !search.isEmpty()) {
            if (filterBanned) {
                return userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseAndAccountNonLocked(
                        search, search, false, pageable);
            }
            if (filterActive) {
                return userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseAndAccountNonLocked(
                        search, search, true, pageable);
            }
            return userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(search, search, pageable);
        }
        if (filterBanned) {
            return userRepository.findByAccountNonLocked(false, pageable);
        }
        if (filterActive) {
            return userRepository.findByAccountNonLocked(true, pageable);
        }
        return userRepository.findAll(pageable);
    }

    @Transactional
    public void banUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountNonLocked(false);
        user.setEnabled(false);
        userRepository.save(user);
        log.info("Banning user: {}", user.getEmail());
    }

    @Transactional
    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountNonLocked(true);
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Unbanning user: {}", user.getEmail());
    }

    // Files Management
    public Map<String, Object> getFileStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<HistoryItem> allHistory = historyRepository.findAll();
        long totalFiles = allHistory.size();
        long totalStorageBytes = allHistory.stream().mapToLong(HistoryItem::getSize).sum();
        
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long transfersToday = historyRepository.findAll().stream()
            .filter(h -> h.getCreatedAt().isAfter(todayStart))
            .count();
        
        double avgFileSizeMB = totalFiles > 0 
            ? (totalStorageBytes / (1024.0 * 1024.0)) / totalFiles 
            : 0;
        
        stats.put("totalFiles", totalFiles);
        stats.put("transfersToday", transfersToday);
        stats.put("avgFileSizeMB", String.format("%.2f", avgFileSizeMB));
        stats.put("totalStorageGB", String.format("%.2f", totalStorageBytes / (1024.0 * 1024.0 * 1024.0)));
        
        return stats;
    }

    public Page<HistoryItem> getFileTransfers(String search, Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return historyRepository.findByFilenameContainingIgnoreCaseOrUserEmailContainingIgnoreCase(search, search, pageable);
        }
        return historyRepository.findAll(pageable);
    }

    @Transactional
    public void deleteFile(Long id) {
        HistoryItem item = historyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
        if (item.getStoredFilename() != null) {
            fileStorageService.deleteFileIfExists(item.getStoredFilename());
        }
        historyRepository.delete(item);
    }

    // Plans Configuration
    public Map<String, Object> getPlanConfigs() {
        Map<String, Object> configs = new HashMap<>();
        
        PlanConfig freeConfig = planConfigRepository.findByPlanName("FREE")
            .orElseGet(() -> createDefaultFreeConfig());
        PlanConfig proConfig = planConfigRepository.findByPlanName("PRO")
            .orElseGet(() -> createDefaultProConfig());
        
        configs.put("free", freeConfig);
        configs.put("pro", proConfig);
        
        return configs;
    }

    @Transactional
    public void updatePlanConfig(String planName, PlanConfig config) {
        PlanConfig existing = planConfigRepository.findByPlanName(planName)
            .orElse(new PlanConfig());
        
        existing.setPlanName(planName);
        existing.setMaxFileSizeMB(config.getMaxFileSizeMB());
        existing.setDailyTransferLimit(config.getDailyTransferLimit());
        existing.setStorageLimitGB(config.getStorageLimitGB());
        existing.setPriorityProcessing(config.getPriorityProcessing());
        
        planConfigRepository.save(existing);
    }

    private PlanConfig createDefaultFreeConfig() {
        PlanConfig config = new PlanConfig();
        config.setPlanName("FREE");
        config.setMaxFileSizeMB(100L);
        config.setDailyTransferLimit(10);
        config.setStorageLimitGB(1L);
        config.setPriorityProcessing(false);
        return planConfigRepository.save(config);
    }

    private PlanConfig createDefaultProConfig() {
        PlanConfig config = new PlanConfig();
        config.setPlanName("PRO");
        config.setMaxFileSizeMB(2048L);
        config.setDailyTransferLimit(-1); // Unlimited
        config.setStorageLimitGB(50L);
        config.setPriorityProcessing(true);
        return planConfigRepository.save(config);
    }

    // Coupons Management
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        if (couponRepository.findByCode(coupon.getCode()).isPresent()) {
            throw new RuntimeException("Coupon code already exists");
        }
        return couponRepository.save(coupon);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        couponRepository.deleteById(id);
    }

    // Transactions
    public Map<String, Object> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        
        Double totalRevenue = transactionRepository.getTotalRevenue();
        Long completed = transactionRepository.countCompletedTransactions();
        Long failed = transactionRepository.countFailedTransactions();
        
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        stats.put("completedCount", completed);
        stats.put("failedCount", failed);
        
        return stats;
    }

    public Page<Transaction> getTransactions(String search, Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return transactionRepository.findByUserEmailContainingIgnoreCase(search, pageable);
        }
        return transactionRepository.findAll(pageable);
    }

    public HistoryItem getHistoryItem(Long id) {
        return historyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }
}
