package com.chickendelivery.service;

import com.chickendelivery.dto.ReturnRequestCreate;
import com.chickendelivery.dto.ReturnRequestResponse;
import com.chickendelivery.dto.ReturnRequestUpdate;
import com.chickendelivery.entity.*;
import com.chickendelivery.repository.OrderItemRepository;
import com.chickendelivery.repository.OrderRepository;
import com.chickendelivery.repository.ReturnRequestRepository;
import com.chickendelivery.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReturnRequestService {

    private final ReturnRequestRepository returnRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public ReturnRequestService(
            ReturnRequestRepository returnRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository
    ) {
        this.returnRepository = returnRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReturnRequestResponse create(
            String email,
            ReturnRequestCreate input
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found."));

        Order order = orderRepository
                .findByIdAndUser(input.getOrderId(), user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Order not found for your account."
                        ));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException(
                    "You can return products only from delivered orders."
            );
        }

        OrderItem item = orderItemRepository
                .findById(input.getOrderItemId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "The selected product was not found."
                        ));

        if (!item.getOrder().getId().equals(order.getId())) {
            throw new IllegalArgumentException(
                    "The selected product does not belong to this order."
            );
        }

        BigDecimal requestedQuantity = input.getQuantity();

        if (requestedQuantity == null
                || requestedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Return quantity must be greater than zero."
            );
        }

        if (item.getQuantity() == null
                || requestedQuantity.compareTo(item.getQuantity()) > 0) {
            throw new IllegalArgumentException(
                    "Return quantity cannot exceed the purchased quantity."
            );
        }

        BigDecimal alreadyRequested = BigDecimal.ZERO;

        List<ReturnRequest> previousRequests =
                returnRepository.findByOrderItemOrderByCreatedAtDesc(item);

        for (ReturnRequest previous : previousRequests) {
            if (previous.getStatus() != ReturnRequestStatus.REJECTED
                    && previous.getReturnQuantity() != null) {
                alreadyRequested = alreadyRequested.add(
                        previous.getReturnQuantity()
                );
            }
        }

        BigDecimal remainingQuantity =
                item.getQuantity().subtract(alreadyRequested);

        if (requestedQuantity.compareTo(remainingQuantity) > 0) {
            throw new IllegalArgumentException(
                    "You have already requested a return for some or all "
                            + "of this product. Remaining return quantity: "
                            + remainingQuantity.stripTrailingZeros()
                            .toPlainString()
            );
        }

        if (input.getReason() == null || input.getReason().isBlank()) {
            throw new IllegalArgumentException(
                    "Please provide a return reason."
            );
        }

        BigDecimal refundAmount = item.getPrice()
                .multiply(requestedQuantity)
                .setScale(2, RoundingMode.HALF_UP);

        ReturnRequest request = new ReturnRequest();
        request.setOrder(order);
        request.setUser(user);
        request.setOrderItem(item);
        request.setReturnQuantity(requestedQuantity);
        request.setReason(input.getReason().trim());
        request.setRefundAmount(refundAmount);
        request.setStatus(ReturnRequestStatus.REQUESTED);

        return new ReturnRequestResponse(
                returnRepository.save(request)
        );
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> mine(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found."));

        return returnRepository
                .findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(ReturnRequestResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> all() {
        return returnRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ReturnRequestResponse::new)
                .toList();
    }

    /**
     * Customer confirms cash receipt for their own return request.
     * Admin must first record the cash refund as REFUNDED.
     */
    @Transactional
    public ReturnRequestResponse confirmCashReceived(
            Long returnRequestId,
            String email
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found."));

        ReturnRequest request = returnRepository.findById(returnRequestId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Return request not found."
                        ));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException(
                    "You are not authorized to confirm this return."
            );
        }

        if (request.getStatus() != ReturnRequestStatus.REFUNDED) {
            throw new IllegalArgumentException(
                    "You can confirm cash receipt only after the admin "
                            + "has recorded the cash refund."
            );
        }

        if (request.getRefundAmount() == null
                || request.getRefundAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "The refund amount is invalid. Please contact support."
            );
        }

        if (!"CASH".equalsIgnoreCase(request.getRefundMethod())) {
            throw new IllegalArgumentException(
                    "This return is not recorded as a cash refund."
            );
        }

        if (request.isCustomerCashConfirmed()) {
            return new ReturnRequestResponse(request);
        }

        request.setCustomerCashConfirmed(true);
        request.setCustomerCashConfirmedAt(LocalDateTime.now());

        ReturnRequest saved = returnRepository.save(request);

        return new ReturnRequestResponse(saved);
    }

    @Transactional
    public ReturnRequestResponse update(
            Long id,
            ReturnRequestUpdate update
    ) {
        ReturnRequest request = returnRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Return request not found."
                        ));

        ReturnRequestStatus current = request.getStatus();
        ReturnRequestStatus next = update.getStatus();

        if (next == null) {
            throw new IllegalArgumentException(
                    "Return status is required."
            );
        }

        boolean allowed = switch (current) {
            case REQUESTED ->
                    next == ReturnRequestStatus.APPROVED
                            || next == ReturnRequestStatus.REJECTED;

            case APPROVED ->
                    next == ReturnRequestStatus.PICKUP_SCHEDULED;

            case PICKUP_SCHEDULED ->
                    next == ReturnRequestStatus.PICKED_UP;

            case PICKED_UP ->
                    next == ReturnRequestStatus.REFUND_PENDING;

            case REFUND_PENDING ->
                    next == ReturnRequestStatus.REFUNDED;

            case REJECTED, REFUNDED -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException(
                    "Invalid return status change: "
                            + current + " to " + next
            );
        }

        if (next == ReturnRequestStatus.APPROVED) {
            if (request.getOrderItem() == null
                    || request.getReturnQuantity() == null
                    || request.getRefundAmount() == null) {
                throw new IllegalArgumentException(
                        "This older return request has no product details. "
                                + "It cannot be approved as an item return."
                );
            }

            request.setRefundMethod("CASH");
        }

        if (next == ReturnRequestStatus.PICKUP_SCHEDULED) {
            request.setPickupScheduledAt(LocalDateTime.now());
        }

        if (next == ReturnRequestStatus.PICKED_UP) {
            request.setPickedUpAt(LocalDateTime.now());
        }

        if (next == ReturnRequestStatus.REFUND_PENDING) {
            request.setRefundMethod("CASH");
        }

        if (next == ReturnRequestStatus.REFUNDED) {
            if (request.getRefundAmount() == null
                    || request.getRefundAmount()
                    .compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "A valid refund amount is required."
                );
            }

            // The admin must select this status only after handing over cash.
            request.setRefundMethod("CASH");
            request.setRefundedAt(LocalDateTime.now());

            if (update.getRefundReference() != null
                    && !update.getRefundReference().isBlank()) {
                request.setRefundReference(
                        update.getRefundReference().trim()
                );
            }

            // New refund action requires a fresh customer confirmation.
            request.setCustomerCashConfirmed(false);
            request.setCustomerCashConfirmedAt(null);
        }

        request.setStatus(next);

        if (update.getAdminNote() != null) {
            request.setAdminNote(update.getAdminNote().trim());
        }

        return new ReturnRequestResponse(
                returnRepository.save(request)
        );
    }
}