package com.anydrop.backend.config;

import com.anydrop.backend.model.User;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Slf4j
public class ThrottlingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Only throttle authenticated users
        if (auth != null && auth.getPrincipal() instanceof User) {
            User user = (User) auth.getPrincipal();
            // Check if user is SCOUT (Free)
            // Assuming Plan name is loaded eagerly
            if (user.getPlan() != null && "SCOUT".equals(user.getPlan().getName())) {
                log.debug("Throttling request for user: {}", user.getEmail());

                // 500 KB/s configuration
                Bandwidth limit = Bandwidth.simple(500000, Duration.ofSeconds(1));
                Bucket bucket = Bucket.builder().addLimit(limit).build();

                // Wrap the request to throttle input stream (Upload)
                HttpServletRequest throttledRequest = new ThrottledRequestWrapper(request, bucket);

                // For downloads, we would need to wrap response output stream, but for now
                // focusing on Upload as requested ("Upload a 50MB file...")
                // To handle downloads properly, we need a ThrottledResponseWrapper as well.
                // Let's implement input throttling for now.

                filterChain.doFilter(throttledRequest, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    // Helper Wrapper
    private static class ThrottledRequestWrapper extends HttpServletRequestWrapper {
        private final Bucket bucket;

        public ThrottledRequestWrapper(HttpServletRequest request, Bucket bucket) {
            super(request);
            this.bucket = bucket;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            return new ThrottledServletInputStream(super.getInputStream(), bucket);
        }
    }

    private static class ThrottledServletInputStream extends ServletInputStream {
        private final ServletInputStream delegate;
        private final Bucket bucket;

        public ThrottledServletInputStream(ServletInputStream delegate, Bucket bucket) {
            this.delegate = delegate;
            this.bucket = bucket;
        }

        @Override
        public int read() throws IOException {
            bucket.asBlocking().consumeUninterruptibly(1);
            return delegate.read();
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            // Consume tokens equal to len or available?
            // Ideally we want to consume exactly what we read.
            // But we need to check limit before reading ideally, or consume after.
            // Simplest is to consume 1 token per byte.
            // Optimization: consume in chunks.
            // Let's say we read `len` bytes. We should create a token requirement.
            // But Blocking consumption might wait.

            // To be accurate, we could read first, then consume? No, that's bursty.
            // Consume first.
            int numToRead = Math.min(len, 500000); // Don't try to read more than capacity at once or it blocks forever
                                                   // if capacity < len
            // Actually capacity is 500,000. len might be 8192 buffer.

            bucket.asBlocking().consumeUninterruptibly(numToRead);
            return delegate.read(b, off, numToRead);
        }

        @Override
        public boolean isFinished() {
            return delegate.isFinished();
        }

        @Override
        public boolean isReady() {
            return delegate.isReady();
        }

        @Override
        public void setReadListener(ReadListener readListener) {
            delegate.setReadListener(readListener);
        }
    }
}
