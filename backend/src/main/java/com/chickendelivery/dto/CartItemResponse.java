package com.chickendelivery.dto;

import java.math.BigDecimal;

import com.chickendelivery.entity.CartItem;

public class CartItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private String description;

    private BigDecimal price;

    private BigDecimal quantity;

    private BigDecimal subtotal;

    private String weight;

    private String sellingUnit;

    private String imageUrl;

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public CartItemResponse() {
    }

    // =========================
    // CART ITEM CONSTRUCTOR
    // =========================

    public CartItemResponse(CartItem cartItem) {

        this.id = cartItem.getId();

        this.quantity = cartItem.getQuantity();

        if (cartItem.getProduct() != null) {

            this.productId = cartItem.getProduct().getId();

            this.productName = cartItem.getProduct().getName();

            this.description = cartItem.getProduct().getDescription();

            this.price = cartItem.getProduct().getPrice();

            this.weight = cartItem.getProduct().getWeight();

            this.sellingUnit =
                    cartItem.getProduct().getSellingUnit();

            this.imageUrl =
                    cartItem.getProduct().getImageUrl();

            /*
             * Backend-calculated subtotal.
             *
             * price × quantity
             */
            if (this.price != null && this.quantity != null) {

                this.subtotal = this.price
                        .multiply(this.quantity)
                        .setScale(
                                2,
                                java.math.RoundingMode.HALF_UP
                        );
            }
        }
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

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
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

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
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
}