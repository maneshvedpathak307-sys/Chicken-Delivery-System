package com.chickendelivery.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chickendelivery.dto.ProfileResponse;
import com.chickendelivery.dto.UpdateProfileRequest;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.UserRepository;

@Service
public class ProfileService {

    private final UserRepository userRepository;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ProfileService(
            UserRepository userRepository) {

        this.userRepository =
                userRepository;
    }


    // =========================================================
    // GET PROFILE
    // =========================================================

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(
            String email) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found"
                                )
                        );


        return convertToResponse(
                user
        );
    }


    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    @Transactional
    public ProfileResponse updateProfile(
            String email,
            UpdateProfileRequest request) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found"
                                )
                        );


        // -----------------------------------------------------
        // NAME
        // -----------------------------------------------------

        if (
                request.getName() == null
                ||
                request.getName()
                        .trim()
                        .isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Name is required"
            );
        }


        user.setName(
                request.getName()
                        .trim()
        );


        // -----------------------------------------------------
        // PHONE
        // -----------------------------------------------------

        if (
                request.getPhone() == null
                ||
                request.getPhone()
                        .trim()
                        .isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Phone number is required"
            );
        }


        user.setPhone(
                request.getPhone()
                        .trim()
        );


        // -----------------------------------------------------
        // ADDRESS
        // -----------------------------------------------------

        user.setAddress(
                request.getAddress() == null
                        ? ""
                        : request.getAddress()
                                .trim()
        );


        // -----------------------------------------------------
        // PHOTO
        // -----------------------------------------------------

        user.setProfilePhoto(
                request.getPhoto() == null
                        ? ""
                        : request.getPhoto()
        );


        // -----------------------------------------------------
        // SAVE USER
        // -----------------------------------------------------

        User savedUser =
                userRepository.save(
                        user
                );


        return convertToResponse(
                savedUser
        );
    }


    // =========================================================
    // ENTITY → RESPONSE
    // =========================================================

    private ProfileResponse convertToResponse(
            User user) {

        return new ProfileResponse(

                user.getId(),

                user.getName(),

                user.getEmail(),

                user.getPhone(),

                user.getAddress(),

                user.getProfilePhoto()
        );
    }
}