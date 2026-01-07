package com.anydrop.backend.controller;

import com.anydrop.backend.model.HistoryItem;
import com.anydrop.backend.model.User;
import com.anydrop.backend.repository.HistoryRepository;
import com.anydrop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryRepository historyRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<HistoryItem>> getHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal(); // Assuming principal is User object
        // Or re-fetch if detached
        // user = userRepository.findByEmail(auth.getName()).orElseThrow();

        return ResponseEntity.ok(historyRepository.findByUser(user));
    }
}
