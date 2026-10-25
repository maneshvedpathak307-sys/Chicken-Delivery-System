package com.chickendelivery.dto;

import java.time.LocalDateTime;

import com.chickendelivery.entity.Address;

public class AddressResponse {

    private Long id;

    private String fullName;

    private String phone;

    private String addressLine;

    private String city;

    private String state;

    private String pincode;

    private Boolean defaultAddress;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public AddressResponse() {
    }

    public AddressResponse(Address address) {

        this.id = address.getId();

        this.fullName = address.getFullName();

        this.phone = address.getPhone();

        this.addressLine = address.getAddressLine();

        this.city = address.getCity();

        this.state = address.getState();

        this.pincode = address.getPincode();

        this.defaultAddress = address.getDefaultAddress();

        this.createdAt = address.getCreatedAt();

        this.updatedAt = address.getUpdatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Boolean getDefaultAddress() {
        return defaultAddress;
    }

    public void setDefaultAddress(Boolean defaultAddress) {
        this.defaultAddress = defaultAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}