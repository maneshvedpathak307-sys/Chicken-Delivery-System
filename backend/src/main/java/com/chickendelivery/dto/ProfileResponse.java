package com.chickendelivery.dto;

public class ProfileResponse {

    private Long id;

    private String name;

    private String email;

    private String phone;

    private String address;

    private String photo;


    // =========================================================
    // EMPTY CONSTRUCTOR
    // =========================================================

    public ProfileResponse() {
    }


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ProfileResponse(
            Long id,
            String name,
            String email,
            String phone,
            String address,
            String photo) {

        this.id = id;

        this.name = name;

        this.email = email;

        this.phone = phone;

        this.address = address;

        this.photo = photo;
    }


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }


    public String getName() {
        return name;
    }


    public String getEmail() {
        return email;
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

    public void setId(Long id) {
        this.id = id;
    }


    public void setName(String name) {
        this.name = name;
    }


    public void setEmail(String email) {
        this.email = email;
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