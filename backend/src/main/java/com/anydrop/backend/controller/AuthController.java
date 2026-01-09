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
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = { "http://localhost:*", "https://localhost:*", "http://127.0.0.1:*",
        "https://127.0.0.1:*", "http://[::1]:*",
        "https://[::1]:*" }, allowCredentials = "true", allowedHeaders = "*", methods = { RequestMethod.GET,
                RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS })
public class AuthController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.anydrop.backend.service.EmailService emailService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PlanRepository planRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            com.anydrop.backend.service.EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        log.info("Registering user: {}", request.getEmail());
        // Default plan setup
        Plan plan = planRepository.findByName("SCOUT") // Default to SCOUT
                .orElseThrow(() -> new RuntimeException("Default plan not found"));

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");
        user.setPlan(plan);

        userRepository.save(user);

        // Send Welcome Email
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());

        var jwtToken = jwtService.generateToken(user);
        AuthResponse response = new AuthResponse();
        response.setToken(jwtToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@RequestBody AuthRequest request) {
        log.info("🔐 Login attempt for: {}", request.getEmail());

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            log.warn("❌ Login attempt with empty email");
            return ResponseEntity.badRequest().body("Email is required");
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            log.warn("❌ Login attempt with empty password for: {}", request.getEmail());
            return ResponseEntity.badRequest().body("Password is required");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim(),
                            request.getPassword()));
            log.info("✅ Authentication successful for: {}", request.getEmail());
        } catch (DisabledException | LockedException e) {
            log.warn("🚫 Banned/locked account login attempt for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(403).body("Your account is banned. Please contact the administrator.");
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            log.error("❌ Invalid credentials for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(401).body("Invalid email or password");
        } catch (org.springframework.security.core.AuthenticationException e) {
            log.error("❌ Authentication failed for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(401).body("Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error during authentication for {}: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(500).body("An error occurred during authentication");
        }

        try {
            var user = userRepository.findByEmail(request.getEmail().trim())
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));
            var jwtToken = jwtService.generateToken(user);

            // Build response with full user profile for frontend
            // Generate display username from email prefix (getUsername returns email for
            // Spring Security)
            String displayUsername = user.getEmail().split("@")[0]; // e.g., "admin" from "admin@anydrop.com"
            String avatarSeed = displayUsername.replaceAll("[^a-zA-Z0-9]", ""); // Clean seed for DiceBear

            log.info("✅ Login successful, returning token for: {}", user.getEmail());

            AuthResponse response = new AuthResponse();
            response.setToken(jwtToken);
            response.setEmail(user.getEmail());
            response.setRole(user.getRole());
            response.setPlan(user.getPlan() != null ? user.getPlan().getName() : "SCOUT");
            response.setUsername(displayUsername);
            response.setAvatar("https://api.dicebear.com/9.x/pixel-art/svg?seed=" + avatarSeed);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error building response for {}: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(500).body("Error processing login response");
        }
    }

    // Initialize Plans if not exist
    @Bean
    public CommandLineRunner initPlans(PlanRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Plan scout = new Plan();
                scout.setName("SCOUT");
                scout.setSpeedLimit(500000);
                scout.setFileSizeLimit(50000000);
                repository.save(scout);

                Plan titan = new Plan();
                titan.setName("TITAN");
                titan.setSpeedLimit(-1);
                titan.setFileSizeLimit(-1);
                repository.save(titan);

                log.info("Plans initialized");
            }
        };
    }

    // Initialize default admin user if not exist
    @Bean
    public CommandLineRunner initDefaultUser(UserRepository userRepo, PlanRepository planRepo) {
        return args -> {
            var existingAdmin = userRepo.findByEmail("admin@anydrop.com");
            if (existingAdmin.isEmpty()) {
                Plan defaultPlan = planRepo.findByName("TITAN")
                        .orElseGet(() -> {
                            Plan titan = new Plan();
                            titan.setName("TITAN");
                            titan.setSpeedLimit(-1);
                            titan.setFileSizeLimit(-1);
                            return planRepo.save(titan);
                        });

                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@anydrop.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ROLE_USER");
                admin.setPlan(defaultPlan);

                userRepo.save(admin);
                log.info("✅ Default admin user created: admin@anydrop.com / admin123");
            } else {
                // Force reset password to ensure we can login
                User admin = existingAdmin.get();
                admin.setPassword(passwordEncoder.encode("admin123"));
                userRepo.save(admin);
                log.info("✅ Default admin password forced reset to: admin123");
            }
        };
    }
}

class RegisterRequest {
    private String username;
    private String email;
    private String password;

    public RegisterRequest() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class AuthRequest {
    private String email;
    private String password;

    public AuthRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String plan;
    private String username;
    private String avatar;

    public AuthResponse() {
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}
