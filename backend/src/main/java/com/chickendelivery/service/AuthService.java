package com.chickendelivery.service;

import com.chickendelivery.dto.RegisterRequest;
import com.chickendelivery.entity.Role;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void registerUser(RegisterRequest request) {

        // Check email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(
                    "Email is already registered"
            );
        }

        // Check phone
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException(
                    "Phone number is already registered"
            );
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());

        // Encrypt password before saving
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setAddress(request.getAddress());

        // Normal registration is always USER
        user.setRole(Role.USER);

        user.setActive(true);

        userRepository.save(user);
    }
}