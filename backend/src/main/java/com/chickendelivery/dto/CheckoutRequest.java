package com.chickendelivery.dto;

import com.chickendelivery.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public class CheckoutRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    public CheckoutRequest() {
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}