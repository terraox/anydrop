package com.anydrop.backend.repository;

import com.anydrop.backend.model.HistoryItem;
import com.anydrop.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface HistoryRepository extends JpaRepository<HistoryItem, Long> {
    List<HistoryItem> findByUser(User user);

    void deleteByCreatedAtBeforeAndUser(LocalDateTime dateTime, User user);

    // For bulk cleanup
    void deleteByCreatedAtBeforeAndUserPlanName(LocalDateTime dateTime, String planName);

    Page<HistoryItem> findByFilenameContainingIgnoreCaseOrUserEmailContainingIgnoreCase(String filename, String email, Pageable pageable);

    long countByUser(User user);
}
