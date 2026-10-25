package com.chickendelivery.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_requests")
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @Column(name = "return_quantity", precision = 10, scale = 3)
    private BigDecimal returnQuantity;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReturnRequestStatus status = ReturnRequestStatus.REQUESTED;

    @Column(length = 1000)
    private String adminNote;

    @Column(length = 50)
    private String refundMethod;

    @Column(length = 150)
    private String refundReference;

    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "customer_cash_confirmed", nullable = false)
    private boolean customerCashConfirmed = false;

    @Column(name = "customer_cash_confirmed_at")
    private LocalDateTime customerCashConfirmedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime pickupScheduledAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime refundedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = ReturnRequestStatus.REQUESTED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public BigDecimal getReturnQuantity() {
        return returnQuantity;
    }

    public void setReturnQuantity(BigDecimal returnQuantity) {
        this.returnQuantity = returnQuantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public ReturnRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ReturnRequestStatus status) {
        this.status = status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public String getRefundMethod() {
        return refundMethod;
    }

    public void setRefundMethod(String refundMethod) {
        this.refundMethod = refundMethod;
    }

    public String getRefundReference() {
        return refundReference;
    }

    public void setRefundReference(String refundReference) {
        this.refundReference = refundReference;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public boolean isCustomerCashConfirmed() {
        return customerCashConfirmed;
    }

    public void setCustomerCashConfirmed(boolean customerCashConfirmed) {
        this.customerCashConfirmed = customerCashConfirmed;
    }

    public LocalDateTime getCustomerCashConfirmedAt() {
        return customerCashConfirmedAt;
    }

    public void setCustomerCashConfirmedAt(
            LocalDateTime customerCashConfirmedAt) {
        this.customerCashConfirmedAt = customerCashConfirmedAt;
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

    public void setPickupScheduledAt(LocalDateTime pickupScheduledAt) {
        this.pickupScheduledAt = pickupScheduledAt;
    }

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public LocalDateTime getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(LocalDateTime refundedAt) {
        this.refundedAt = refundedAt;
    }
}