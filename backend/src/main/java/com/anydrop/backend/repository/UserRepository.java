package com.anydrop.backend.repository;

import com.anydrop.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Page<User> findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(String email, String username, Pageable pageable);

    Page<User> findByAccountNonLocked(boolean accountNonLocked, Pageable pageable);

    Page<User> findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseAndAccountNonLocked(String email, String username, boolean accountNonLocked, Pageable pageable);
}
