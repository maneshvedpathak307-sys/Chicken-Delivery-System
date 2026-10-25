package com.chickendelivery.dto;

import com.chickendelivery.entity.OrderItem;
import com.chickendelivery.entity.ReturnRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReturnRequestResponse {

    private Long returnRequestId;
    private Long orderId;
    private Long orderItemId;
    private Long userId;

    private String customerName;
    private String customerEmail;

    private String productName;
    private String weight;

    private BigDecimal unitPrice;
    private BigDecimal purchasedQuantity;
    private BigDecimal returnQuantity;
    private BigDecimal refundAmount;

    private String reason;
    private String status;
    private String adminNote;
    private String refundMethod;
    private String refundReference;

    private boolean customerCashConfirmed;
    private LocalDateTime customerCashConfirmedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime pickupScheduledAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime refundedAt;

    public ReturnRequestResponse(ReturnRequest request) {
        this.returnRequestId = request.getId();
        this.orderId = request.getOrder().getId();
        this.userId = request.getUser().getId();

        this.customerName = request.getUser().getName();
        this.customerEmail = request.getUser().getEmail();

        OrderItem item = request.getOrderItem();

        if (item != null) {
            this.orderItemId = item.getId();
            this.productName = item.getProductName();
            this.weight = item.getWeight();
            this.unitPrice = item.getPrice();
            this.purchasedQuantity = item.getQuantity();
        }

        this.returnQuantity = request.getReturnQuantity();
        this.refundAmount = request.getRefundAmount();

        this.reason = request.getReason();
        this.status = request.getStatus().name();
        this.adminNote = request.getAdminNote();

        this.refundMethod = request.getRefundMethod();
        this.refundReference = request.getRefundReference();

        this.customerCashConfirmed =
                request.isCustomerCashConfirmed();

        this.customerCashConfirmedAt =
                request.getCustomerCashConfirmedAt();

        this.createdAt = request.getCreatedAt();
        this.updatedAt = request.getUpdatedAt();
        this.pickupScheduledAt = request.getPickupScheduledAt();
        this.pickedUpAt = request.getPickedUpAt();
        this.refundedAt = request.getRefundedAt();
    }

    public Long getReturnRequestId() {
        return returnRequestId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getProductName() {
        return productName;
    }

    public String getWeight() {
        return weight;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getPurchasedQuantity() {
        return purchasedQuantity;
    }

    public BigDecimal getReturnQuantity() {
        return returnQuantity;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public String getReason() {
        return reason;
    }

    public String getStatus() {
        return status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public String getRefundMethod() {
        return refundMethod;
    }

    public String getRefundReference() {
        return refundReference;
    }

    public boolean isCustomerCashConfirmed() {
        return customerCashConfirmed;
    }

    public LocalDateTime getCustomerCashConfirmedAt() {
        return customerCashConfirmedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getPickupScheduledAt() {
        return pickupScheduledAt;
    }

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public LocalDateTime getRefundedAt() {
        return refundedAt;
    }
}