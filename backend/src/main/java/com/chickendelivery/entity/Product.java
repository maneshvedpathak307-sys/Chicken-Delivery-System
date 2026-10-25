package com.chickendelivery.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    /*
     * KG product:
     * price = price per KG
     *
     * PIECE product:
     * price = price per piece
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /*
     * Display/reference value.
     *
     * Examples:
     * 1 KG
     * 1 PC
     */
    @Column(nullable = false)
    private String weight;

    /*
     * Allowed values:
     *
     * KG
     * PIECE
     */
    @Column(name = "selling_unit", length = 20)
    private String sellingUnit;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // =========================
    // CONSTRUCTOR
    // =========================

    public Product() {
    }

    // =========================
    // CREATE / UPDATE TIMESTAMP
    // =========================

    @PrePersist
    protected void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
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

    /*
     * If an old product has no sellingUnit,
     * automatically determine it from the weight.
     *
     * Examples:
     *
     * "12 PCS" -> PIECE
     * "1 PC"    -> PIECE
     * "1 KG"    -> KG
     */
    public String getSellingUnit() {

        if (sellingUnit == null || sellingUnit.isBlank()) {

            String value =
                    weight == null
                            ? ""
                            : weight.trim().toUpperCase();

            if (value.contains("PCS")
                    || value.contains("PIECE")
                    || value.matches(".*\\bPC\\b.*")) {

                return "PIECE";
            }

            return "KG";
        }

        return sellingUnit.trim().toUpperCase();
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