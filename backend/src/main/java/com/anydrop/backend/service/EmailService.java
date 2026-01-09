package com.anydrop.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendWelcomeEmail(String toEmail, String username) {
        try {
            jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    mimeMessage, "utf-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("System Initialized: Welcome to AnyDrop");

            String htmlMsg = "<h3>Hello " + username + "</h3>" +
                    "<p>Your neural link is active. You are currently on the <b>Scout Plan</b>.</p>" +
                    "<p>Start dropping files in your Orbit or connect your phone to enable Remote Control.</p>" +
                    "<hr>" +
                    "<p><i>This is an automated message.</i></p>";

            helper.setText(htmlMsg, true); // true = isHtml

            mailSender.send(mimeMessage);
            log.info("Welcome email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email", e);
        }
    }

    public void sendForgotPasswordEmail(String toEmail, String otpCode) {
        try {
            jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    mimeMessage, "utf-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("Security Alert: Password Reset Requested");

            String htmlMsg = "<h3>Password Reset Request</h3>" +
                    "<p>Use the following code to reset your access:</p>" +
                    "<h2>" + otpCode + "</h2>" +
                    "<p>This code expires in 15 minutes.</p>" +
                    "<p style='color:red;'>If you did not request this, secure your account immediately.</p>";

            helper.setText(htmlMsg, true);

            mailSender.send(mimeMessage);
            log.info("Forgot password email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send forgot password email", e);
        }
    }
}
