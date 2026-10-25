package com.chickendelivery.controller;

import java.util.HashMap;
import java.util.Map;

import com.chickendelivery.dto.ApiResponse;
import com.chickendelivery.dto.LoginRequest;
import com.chickendelivery.dto.LoginResponse;
import com.chickendelivery.dto.RegisterRequest;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.UserRepository;
import com.chickendelivery.security.JwtService;
import com.chickendelivery.service.AuthService;
import com.chickendelivery.service.ForgotPasswordService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ForgotPasswordService forgotPasswordService;

    public AuthController(
            AuthService authService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ForgotPasswordService forgotPasswordService) {

        this.authService = authService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.forgotPasswordService = forgotPasswordService;
    }

    // =========================
    // USER REGISTRATION
    // =========================

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        authService.registerUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse(
                        true,
                        "Registration successful"
                ));
    }

    // =========================
    // USER LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(
                            false,
                            "Invalid email or password",
                            null,
                            null,
                            null,
                            null,
                            null
                    ));
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(new LoginResponse(
                            false,
                            "Your account is inactive",
                            null,
                            null,
                            null,
                            null,
                            null
                    ));
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(
                            false,
                            "Invalid email or password",
                            null,
                            null,
                            null,
                            null,
                            null
                    ));
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId()
        );

        LoginResponse response = new LoginResponse(
                true,
                "Login successful",
                token,
                user.getRole().name(),
                user.getId(),
                user.getName(),
                user.getEmail()
        );

        return ResponseEntity.ok(response);
    }

    // =========================
    // FORGOT PASSWORD
    // =========================

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");

        forgotPasswordService.verifyEmail(email);

        return ResponseEntity.ok(
                new ApiResponse(
                        true,
                        "Email verified successfully."
                )
        );
    }

    // =========================
    // RESET PASSWORD
    // =========================

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String newPassword = request.get("newPassword");

        forgotPasswordService.resetPassword(email, newPassword);

        return ResponseEntity.ok(
                new ApiResponse(
                        true,
                        "Password reset successfully."
                )
        );
    }

    // =========================
    // CURRENT USER
    // =========================

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        String email = authentication.getName();

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "Authenticated user");
        response.put("userId", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("address", user.getAddress());
        response.put("role", user.getRole().name());
        response.put("active", user.getActive());

        return ResponseEntity.ok(response);
    }
}