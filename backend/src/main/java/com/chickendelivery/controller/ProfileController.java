package com.chickendelivery.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chickendelivery.dto.ProfileResponse;
import com.chickendelivery.dto.UpdateProfileRequest;
import com.chickendelivery.service.ProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ProfileController(
            ProfileService profileService) {

        this.profileService =
                profileService;
    }


    // =========================================================
    // GET MY PROFILE
    // =========================================================

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(
            Authentication authentication) {

        ProfileResponse profile =
                profileService.getProfile(
                        authentication.getName()
                );


        Map<String, Object> response =
                new HashMap<>();


        response.put(
                "success",
                true
        );


        response.put(
                "message",
                "Profile fetched successfully"
        );


        response.put(
                "profile",
                profile
        );


        return ResponseEntity.ok(
                response
        );
    }


    // =========================================================
    // UPDATE MY PROFILE
    // =========================================================

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {

        ProfileResponse profile =
                profileService.updateProfile(
                        authentication.getName(),
                        request
                );


        Map<String, Object> response =
                new HashMap<>();


        response.put(
                "success",
                true
        );


        response.put(
                "message",
                "Profile updated successfully"
        );


        response.put(
                "profile",
                profile
        );


        return ResponseEntity.ok(
                response
        );
    }
}