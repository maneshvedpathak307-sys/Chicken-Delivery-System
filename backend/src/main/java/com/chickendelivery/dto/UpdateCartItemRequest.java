package com.chickendelivery.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class UpdateCartItemRequest {

    /*
     * Chicken examples:
     * 0.250 = 250 g
     * 0.500 = 500 g
     * 0.750 = 750 g
     * 1.000 = 1 KG
     * 1.500 = 1.5 KG
     *
     * Eggs examples:
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
    // CONSTRUCTOR
    // =========================

    public UpdateCartItemRequest() {
    }

    // =========================
    // GETTER
    // =========================

    public BigDecimal getQuantity() {
        return quantity;
    }

    // =========================
    // SETTER
    // =========================

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}