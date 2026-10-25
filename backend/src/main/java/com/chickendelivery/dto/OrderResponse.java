package com.chickendelivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.chickendelivery.entity.Order;
import com.chickendelivery.entity.OrderItem;
import com.chickendelivery.entity.Payment;

public class OrderResponse {

    private Long orderId;

    private Long userId;

    private String customerName;

    private String customerEmail;

    private OrderStatusResponse status;

    private BigDecimal totalAmount;

    private Integer totalItems;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private DeliveryAddressResponse deliveryAddress;

    private PaymentResponse payment;

    private List<OrderItemResponse> items;


    // =========================================================
    // DEFAULT CONSTRUCTOR
    // =========================================================

    public OrderResponse() {
    }


    // =========================================================
    // MAIN CONSTRUCTOR
    // =========================================================

    public OrderResponse(
            Order order,
            List<OrderItem> orderItems,
            Payment payment) {

        this.orderId =
                order.getId();


        // =====================================================
        // CUSTOMER INFORMATION
        // =====================================================

        if (order.getUser() != null) {

            this.userId =
                    order.getUser().getId();

            this.customerName =
                    order.getUser().getName();

            this.customerEmail =
                    order.getUser().getEmail();
        }


        // =====================================================
        // STATUS
        // =====================================================

        this.status =
                new OrderStatusResponse(
                        order.getStatus()
                );


        // =====================================================
        // TOTAL
        // =====================================================

        this.totalAmount =
                order.getTotalAmount();


        // =====================================================
        // TOTAL ITEMS
        // =====================================================

        this.totalItems =
                orderItems != null
                        ? orderItems.size()
                        : 0;


        // =====================================================
        // DATE
        // =====================================================

        this.createdAt =
                order.getCreatedAt();

        this.updatedAt =
                order.getUpdatedAt();


        // =====================================================
        // DELIVERY ADDRESS
        //
        // This contains:
        //
        // Full Name
        // Phone
        // Address
        // City
        // State
        // Pincode
        // =====================================================

        this.deliveryAddress =
                new DeliveryAddressResponse(
                        order
                );


        // =====================================================
        // PAYMENT
        // =====================================================

        if (payment != null) {

            this.payment =
                    new PaymentResponse(
                            payment
                    );
        }


        // =====================================================
        // ORDER ITEMS
        // =====================================================

        this.items =
                orderItems != null
                        ? orderItems.stream()
                                .map(
                                        OrderItemResponse::new
                                )
                                .toList()
                        : List.of();
    }


    // =========================================================
    // GETTERS / SETTERS
    // =========================================================

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }


    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }


    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(
            String customerName) {

        this.customerName =
                customerName;
    }


    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(
            String customerEmail) {

        this.customerEmail =
                customerEmail;
    }


    public OrderStatusResponse getStatus() {
        return status;
    }

    public void setStatus(
            OrderStatusResponse status) {

        this.status =
                status;
    }


    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(
            BigDecimal totalAmount) {

        this.totalAmount =
                totalAmount;
    }


    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(
            Integer totalItems) {

        this.totalItems =
                totalItems;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt =
                createdAt;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt) {

        this.updatedAt =
                updatedAt;
    }


    public DeliveryAddressResponse getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(
            DeliveryAddressResponse deliveryAddress) {

        this.deliveryAddress =
                deliveryAddress;
    }


    public PaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(
            PaymentResponse payment) {

        this.payment =
                payment;
    }


    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(
            List<OrderItemResponse> items) {

        this.items =
                items;
    }
}