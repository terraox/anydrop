package com.anydrop.backend.service;

import com.anydrop.backend.model.User;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ThrottlingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(User user) {
        if (user == null || user.getPlan() == null) {
            return null; // No limits
        }

        // If plan is Scout, limit to 500KB/s
        if ("SCOUT".equalsIgnoreCase(user.getPlan().getName())) {
            return buckets.computeIfAbsent(user.getEmail(), k -> {
                Bandwidth limit = Bandwidth.simple(500000, Duration.ofSeconds(1));
                return Bucket.builder().addLimit(limit).build();
            });
        }

        // Titan = Unlimited
        return null;
    }

    // Helper to consume
    public void consume(Bucket bucket, int tokens) {
        if (bucket != null) {
            try {
                bucket.asBlocking().consumeUninterruptibly(tokens);
            } catch (Exception e) {
                // Ignore interruption
            }
        }
    }
}
