package com.chickendelivery.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class AddToCartRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    /*
     * Chicken:
     * 0.250 = 250 g
     * 0.500 = 500 g
     * 0.750 = 750 g
     * 1.000 = 1 KG
     *
     * Eggs:
     * 1 = 1 egg
     * 5 = 5 eggs
     * 10 = 10 eggs
     */
    @NotNull(message = "Quantity is required")
    @DecimalMin(
        value = "0.001",
        inclusive = true,
        message = "Quantity must be greater than 0"
    )
    private BigDecimal quantity;

    // =========================
    // CONSTRUCTORS
    // =========================

    public AddToCartRequest() {
    }

    // =========================
    // GETTERS AND SETTERS
    // =========================

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}