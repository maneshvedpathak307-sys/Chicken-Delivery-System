package com.chickendelivery.dto;

import java.math.BigDecimal;

import com.chickendelivery.entity.OrderItem;

public class OrderItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private BigDecimal price;

    private BigDecimal quantity;

    private BigDecimal subtotal;

    private String weight;

    private String sellingUnit;

    private String imageUrl;

    // =========================
    // DEFAULT CONSTRUCTOR
    // =========================

    public OrderItemResponse() {
    }

    // =========================
    // ORDER ITEM CONSTRUCTOR
    // =========================

    public OrderItemResponse(OrderItem orderItem) {

        this.id = orderItem.getId();

        this.productName = orderItem.getProductName();

        this.price = orderItem.getPrice();

        this.quantity = orderItem.getQuantity();

        this.subtotal = orderItem.getSubtotal();

        this.weight = orderItem.getWeight();

        if (orderItem.getProduct() != null) {

            this.productId =
                    orderItem.getProduct().getId();

            this.sellingUnit =
                    orderItem.getProduct().getSellingUnit();

            this.imageUrl =
                    orderItem.getProduct().getImageUrl();
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