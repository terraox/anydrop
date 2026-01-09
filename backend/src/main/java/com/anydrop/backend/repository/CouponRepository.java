package com.anydrop.backend.repository;

import com.anydrop.backend.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    List<Coupon> findByExpiryDateAfter(LocalDate date);
    List<Coupon> findByExpiryDateBefore(LocalDate date);
}
