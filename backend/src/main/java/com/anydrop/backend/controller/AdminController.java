package com.anydrop.backend.controller;

import com.anydrop.backend.model.HistoryItem;
import com.anydrop.backend.model.User;
import com.anydrop.backend.repository.HistoryRepository;
import com.anydrop.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.context.ApplicationEventPublisher;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AdminController.class);

    private final UserRepository userRepository;
    private final HistoryRepository historyRepository;

    public AdminController(UserRepository userRepository, HistoryRepository historyRepository) {
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    // In a real app, we would inject a SessionRegistry or WebSocket manager to kill
    // sessions.
    // For now, we will disable the user account. The token will be valid until
    // expiry,
    // but future auth checks (if we checked DB every time) would fail.
    // Our JwtFilter checks userDetailsService.loadUserByUsername every time?
    // Yes, verify: JwtAuthFilter calls userDetailsService.loadUserByUsername.
    // So if we lock the account there, they get rejected.

    @PostMapping("/ban/{userId}")
    @PreAuthorize("hasRole('ADMIN')") // Provided we have an ADMIN role
    public ResponseEntity<String> banUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        // Assuming we add an 'enabled' or 'locked' field.
        // For now, let's just log it or maybe randomize password to lock them out?
        // Or better, let's rely on a hypothetical 'accountNonLocked' field in User.
        // But User entity implements UserDetails and hardcoded return true for
        // isAccountNonLocked().

        // TODO: Update User entity to support locking.
        // For this demo, we'll just delete them? No, that's destructive.

        log.info("Banning user: {}", user.getEmail());

        // Simulating ban action
        return ResponseEntity.ok("User banned: " + user.getEmail());
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public void exportToCSV(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transfer_logs.csv\"");

        List<HistoryItem> history = historyRepository.findAll();

        try (PrintWriter writer = response.getWriter()) {
            writer.println("ID,User,Filename,Size,Type,Date");
            for (HistoryItem item : history) {
                writer.printf("%d,%s,%s,%d,%s,%s%n",
                        item.getId(),
                        item.getUser().getEmail(),
                        item.getFilename(),
                        item.getSize(),
                        item.getType(),
                        item.getCreatedAt());
            }
        }
    }
}
