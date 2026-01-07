package com.anydrop.backend.controller;

import com.anydrop.backend.model.Plan;
import com.anydrop.backend.model.User;
import com.anydrop.backend.repository.PlanRepository;
import com.anydrop.backend.repository.UserRepository;
import com.anydrop.backend.security.JwtService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.anydrop.backend.service.EmailService emailService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        log.info("Registering user: {}", request.getEmail());
        // Default plan setup
        Plan plan = planRepository.findByName("SCOUT") // Default to SCOUT
                .orElseThrow(() -> new RuntimeException("Default plan not found"));

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER") // Default role
                .plan(plan)
                .build();
        userRepository.save(user);

        // Send Welcome Email
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());

        var jwtToken = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder().token(jwtToken).build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder().token(jwtToken).build());
    }

    // Initialize Plans if not exist
    @Bean
    public CommandLineRunner initPlans(PlanRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(Plan.builder().name("SCOUT").speedLimit(500000).fileSizeLimit(50000000).build()); // 500KB/s,
                                                                                                                  // 50MB
                repository.save(Plan.builder().name("TITAN").speedLimit(-1).fileSizeLimit(-1).build()); // Unlimited
                log.info("Plans initialized");
            }
        };
    }
}

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
class RegisterRequest {
    private String username;
    private String email;
    private String password;
}

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
class AuthRequest {
    private String email;
    private String password;
}

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
class AuthResponse {
    private String token;
}
