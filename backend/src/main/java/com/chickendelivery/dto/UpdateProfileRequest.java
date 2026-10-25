package com.chickendelivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    // =========================================================
    // NAME
    // =========================================================

    @NotBlank(message = "Name is required")
    @Size(
        max = 100,
        message = "Name cannot exceed 100 characters"
    )
    private String name;


    // =========================================================
    // PHONE
    // =========================================================

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[0-9+\\-\\s]{10,15}$",
        message = "Please enter a valid phone number"
    )
    private String phone;


    // =========================================================
    // ADDRESS
    // =========================================================

    @Size(
        max = 500,
        message = "Address cannot exceed 500 characters"
    )
    private String address;


    // =========================================================
    // PHOTO
    // =========================================================

    private String photo;


    // =========================================================
    // GETTERS
    // =========================================================

    public String getName() {
        return name;
    }


    public String getPhone() {
        return phone;
    }


    public String getAddress() {
        return address;
    }


    public String getPhoto() {
        return photo;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setName(String name) {
        this.name = name;
    }


    public void setPhone(String phone) {
        this.phone = phone;
    }


    public void setAddress(String address) {
        this.address = address;
    }


    public void setPhoto(String photo) {
        this.photo = photo;
    }
}