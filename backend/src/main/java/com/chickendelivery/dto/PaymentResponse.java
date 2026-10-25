package com.chickendelivery.dto;

import java.math.BigDecimal;

import com.chickendelivery.entity.Payment;

public class PaymentResponse {

    private Long paymentId;

    private String paymentMethod;

    private String paymentStatus;

    private BigDecimal amount;

    private String transactionId;

    public PaymentResponse() {
    }

    public PaymentResponse(Payment payment) {

        this.paymentId = payment.getId();

        this.paymentMethod =
                payment.getPaymentMethod().name();

        this.paymentStatus =
                payment.getPaymentStatus().name();

        this.amount = payment.getAmount();

        this.transactionId =
                payment.getTransactionId();
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
}