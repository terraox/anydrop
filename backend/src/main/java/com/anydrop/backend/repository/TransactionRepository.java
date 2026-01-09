package com.anydrop.backend.repository;

import com.anydrop.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Page<Transaction> findByUserEmailContainingIgnoreCase(String email, Pageable pageable);
    Page<Transaction> findByStatus(String status, Pageable pageable);
    Page<Transaction> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.status = 'completed'")
    Double getTotalRevenue();
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'completed'")
    Long countCompletedTransactions();
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'failed'")
    Long countFailedTransactions();
}
