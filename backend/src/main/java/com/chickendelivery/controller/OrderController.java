package com.chickendelivery.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chickendelivery.dto.CheckoutRequest;
import com.chickendelivery.dto.OrderResponse;
import com.chickendelivery.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // CUSTOMER - CHECKOUT

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request) {

        OrderResponse order = orderService.checkout(
                authentication.getName(),
                request.getPaymentMethod());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Order placed successfully");
        response.put("order", order);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // CUSTOMER - GET MY ORDERS

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyOrders(
            Authentication authentication) {

        List<OrderResponse> orders =
                orderService.getMyOrders(authentication.getName());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Orders fetched successfully");
        response.put("count", orders.size());
        response.put("orders", orders);

        return ResponseEntity.ok(response);
    }

    // CUSTOMER - GET MY ORDER DETAILS

    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getMyOrder(
            Authentication authentication,
            @PathVariable Long orderId) {

        OrderResponse order = orderService.getMyOrder(
                authentication.getName(), orderId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Order fetched successfully");
        response.put("order", order);

        return ResponseEntity.ok(response);
    }

    // CUSTOMER - CANCEL MY ORDER

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelMyOrder(
            Authentication authentication,
            @PathVariable Long orderId) {

        Map<String, Object> response = new LinkedHashMap<>();

        try {
            OrderResponse order = orderService.cancelMyOrder(
                    authentication.getName(), orderId);

            response.put("success", true);
            response.put(
                    "message",
                    "Your order has been cancelled successfully.");
            response.put("order", order);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException exception) {
            response.put("success", false);
            response.put("message", exception.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    // CUSTOMER - ONLINE PAYMENT CONFIRMATION
    //
    // DEMO ONLY: This simulates payment confirmation.
    // It must NOT be used to verify real UPI transactions.

    @PostMapping("/{orderId}/payment/confirm")
    public ResponseEntity<Map<String, Object>> confirmOnlinePayment(
            Authentication authentication,
            @PathVariable Long orderId) {

        Map<String, Object> response = new LinkedHashMap<>();

        try {
            OrderResponse order = orderService.confirmOnlinePaymentDemo(
                    authentication.getName(), orderId);

            response.put("success", true);
            response.put(
                    "message",
                    "Demo online payment marked as paid.");
            response.put("paymentStatus", order.getPayment().getPaymentStatus());
            response.put("order", order);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException exception) {
            response.put("success", false);
            response.put("message", exception.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }
}