package com.chickendelivery.dto;

public class LoginResponse {

    private boolean success;
    private String message;
    private String token;
    private String role;
    private Long userId;
    private String name;
    private String email;

    public LoginResponse() {
    }

    public LoginResponse(
            boolean success,
            String message,
            String token,
            String role,
            Long userId,
            String name,
            String email) {

        this.success = success;
        this.message = message;
        this.token = token;
        this.role = role;
        this.userId = userId;
        this.name = name;
        this.email = email;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}