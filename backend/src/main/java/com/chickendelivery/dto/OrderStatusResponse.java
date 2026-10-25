package com.chickendelivery.dto;

import com.chickendelivery.entity.OrderStatus;

public class OrderStatusResponse {

    private String code;

    private String label;

    public OrderStatusResponse() {
    }

    public OrderStatusResponse(OrderStatus status) {

        this.code = status.name();

        this.label = formatLabel(status);
    }

    private String formatLabel(OrderStatus status) {

        return switch (status) {

            case PENDING -> "Pending";

            case CONFIRMED -> "Confirmed";

            case OUT_FOR_DELIVERY -> "Out for Delivery";

            case DELIVERED -> "Delivered";

            case CANCELLED -> "Cancelled";
        };
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}