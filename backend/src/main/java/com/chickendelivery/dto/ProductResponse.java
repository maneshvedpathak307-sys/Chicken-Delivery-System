package com.chickendelivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.chickendelivery.entity.Product;

public class ProductResponse {

    private Long id;

    private String name;

    private String description;

    private BigDecimal price;

    private String weight;

    private String sellingUnit;

    private String imageUrl;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public ProductResponse() {
    }

    // =========================
    // PRODUCT CONSTRUCTOR
    // =========================

    public ProductResponse(Product product) {

        this.id = product.getId();

        this.name = product.getName();

        this.description = product.getDescription();

        this.price = product.getPrice();

        this.weight = product.getWeight();

        this.sellingUnit = product.getSellingUnit();

        this.imageUrl = product.getImageUrl();

        this.active = product.getActive();

        this.createdAt = product.getCreatedAt();

        this.updatedAt = product.getUpdatedAt();
    }

    // =========================
    // GETTERS AND SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }

    public String getSellingUnit() {
        return sellingUnit;
    }

    public void setSellingUnit(String sellingUnit) {
        this.sellingUnit = sellingUnit;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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