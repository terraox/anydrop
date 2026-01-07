package com.anydrop.backend.task;

import com.anydrop.backend.repository.HistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupTask {

    private final HistoryRepository historyRepository;

    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void cleanupOldHistory() {
        log.info("Starting cleanup task...");

        // Free users: 24 hours
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        historyRepository.deleteByCreatedAtBeforeAndUserPlanName(twentyFourHoursAgo, "SCOUT");

        // Pro users: 30 days
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        historyRepository.deleteByCreatedAtBeforeAndUserPlanName(thirtyDaysAgo, "TITAN");

        log.info("Cleanup task completed.");
    }
}
