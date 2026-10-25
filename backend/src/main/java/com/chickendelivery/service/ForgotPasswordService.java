package com.chickendelivery.service;

import com.chickendelivery.entity.User;
import com.chickendelivery.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ForgotPasswordService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void verifyEmail(String email) {
        // Validate that the account exists and is active.
        // No OTP or email is sent in this college-demo flow.
        findActiveUser(email);
    }

    @Transactional
    public void resetPassword(String email, String newPassword) {

        if (newPassword == null || newPassword.length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters."
            );
        }

        User user = findActiveUser(email);

        // Store the BCrypt hash, never the plain-text password.
        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);
    }

    private User findActiveUser(String email) {

        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please enter your registered email address."
            );
        }

        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No account found with this email address."
                ));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This account is inactive."
            );
        }

        return user;
    }
}