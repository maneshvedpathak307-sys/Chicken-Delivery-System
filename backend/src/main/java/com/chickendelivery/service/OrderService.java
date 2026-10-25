package com.chickendelivery.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chickendelivery.dto.OrderResponse;
import com.chickendelivery.entity.Cart;
import com.chickendelivery.entity.CartItem;
import com.chickendelivery.entity.Order;
import com.chickendelivery.entity.OrderItem;
import com.chickendelivery.entity.OrderStatus;
import com.chickendelivery.entity.Payment;
import com.chickendelivery.entity.PaymentMethod;
import com.chickendelivery.entity.PaymentStatus;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.CartItemRepository;
import com.chickendelivery.repository.CartRepository;
import com.chickendelivery.repository.OrderItemRepository;
import com.chickendelivery.repository.OrderRepository;
import com.chickendelivery.repository.PaymentRepository;
import com.chickendelivery.repository.UserRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            PaymentRepository paymentRepository) {

        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    // =========================================================
    // CHECKOUT USING SAVED PROFILE DETAILS
    // =========================================================

    @Transactional
    public OrderResponse checkout(
            String email,
            PaymentMethod paymentMethod) {

        User user = getUserByEmail(email);

        if (paymentMethod == null) {
            throw new IllegalArgumentException(
                    "Payment method is required");
        }

        String fullName = user.getName();
        String phone = user.getPhone();
        String addressLine = user.getAddress();

        if (fullName == null || fullName.trim().isEmpty()
                || phone == null || phone.trim().isEmpty()
                || addressLine == null || addressLine.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Please update your name, phone number, and delivery address in your Profile before checkout.");
        }

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() ->
                        new IllegalArgumentException("Cart not found"));

        List<CartItem> cartItems =
                cartItemRepository.findByCartOrderByIdAsc(cart);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Your cart is empty");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(BigDecimal.ZERO);

        order.setDeliveryFullName(fullName.trim());
        order.setDeliveryPhone(phone.trim());
        order.setDeliveryAddressLine(addressLine.trim());

        // Retain compatibility with the existing Order entity.
        order.setDeliveryCity("");
        order.setDeliveryState("");
        order.setDeliveryPincode("");

        Order savedOrder = orderRepository.save(order);

        for (CartItem cartItem : cartItems) {

            if (cartItem.getProduct() == null) {
                throw new IllegalArgumentException(
                        "Product not found for cart item");
            }

            BigDecimal price = cartItem.getProduct().getPrice();
            BigDecimal quantity = cartItem.getQuantity();

            if (price == null
                    || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "Invalid product price");
            }

            if (quantity == null
                    || quantity.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "Invalid product quantity");
            }

            // Chicken: price per KG × quantity in KG.
            // Eggs: price per piece × number of pieces.
            BigDecimal subtotal = price.multiply(quantity)
                    .setScale(2, RoundingMode.HALF_UP);

            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(savedOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setProductName(
                    cartItem.getProduct().getName());
            orderItem.setWeight(
                    cartItem.getProduct().getWeight());
            orderItem.setPrice(price);
            orderItem.setQuantity(quantity);
            orderItem.setSubtotal(subtotal);

            orderItemRepository.save(orderItem);

            totalAmount = totalAmount.add(subtotal);
        }

        totalAmount = totalAmount.setScale(
                2, RoundingMode.HALF_UP);

        savedOrder.setTotalAmount(totalAmount);
        savedOrder = orderRepository.save(savedOrder);

        Payment payment = new Payment();

        payment.setOrder(savedOrder);
        payment.setPaymentMethod(paymentMethod);
        payment.setAmount(totalAmount);
        payment.setPaymentStatus(PaymentStatus.PENDING);

        Payment savedPayment = paymentRepository.save(payment);

        // Clear the cart after the order and payment are saved.
        cartItemRepository.deleteByCart(cart);

        List<OrderItem> savedItems =
                orderItemRepository.findByOrderOrderByIdAsc(savedOrder);

        return new OrderResponse(
                savedOrder,
                savedItems,
                savedPayment);
    }
    
 // =========================================================
    // CUSTOMER - DEMO ONLINE PAYMENT CONFIRMATION
    //
    // IMPORTANT:
    // This simulates payment for a college project.
    // It does not verify a real UPI transaction.
    // =========================================================

    @Transactional
    public OrderResponse confirmOnlinePaymentDemo(
            String email,
            Long orderId) {

        User user = getUserByEmail(email);

        // Ensure the order belongs to the logged-in customer.
        Order order = orderRepository
                .findByIdAndUser(orderId, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Order not found for your account"));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Payment cannot be confirmed for a cancelled order.");
        }

        Payment payment = paymentRepository
                .findByOrder(order)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Payment record not found for this order."));

        if (payment.getPaymentMethod() != PaymentMethod.ONLINE) {
            throw new IllegalArgumentException(
                    "This order is not an online payment order.");
        }

        // Allow repeated requests for an already-paid order.
        if (payment.getPaymentStatus() != PaymentStatus.PAID) {

            if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
                throw new IllegalArgumentException(
                        "This payment is not pending and cannot be confirmed.");
            }

            /*
             * DEMO SIMULATION ONLY:
             * This sets PAID without checking a UPI transaction.
             *
             * For real payments, replace this section with a
             * payment gateway's server-side verification.
             */
            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setTransactionId(
                    "DEMO-" + order.getId() + "-" + System.currentTimeMillis());

            paymentRepository.save(payment);
        }

        return buildOrderResponse(order);
    }

    // =========================================================
    // CUSTOMER - GET MY ORDERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String email) {

        User user = getUserByEmail(email);

        return orderRepository
                .findByUserOrderByIdDesc(user)
                .stream()
                .map(this::buildOrderResponse)
                .toList();
    }

    // =========================================================
    // CUSTOMER - GET MY ORDER
    // =========================================================

    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(
            String email,
            Long orderId) {

        User user = getUserByEmail(email);

        Order order = orderRepository
                .findByIdAndUser(orderId, user)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found"));

        return buildOrderResponse(order);
    }

    // =========================================================
    // CUSTOMER - CANCEL MY ORDER
    //
    // Customers can cancel only their own PENDING or CONFIRMED
    // orders. Ownership is checked using the authenticated email.
    // =========================================================

    @Transactional
    public OrderResponse cancelMyOrder(
            String email,
            Long orderId) {

        User user = getUserByEmail(email);

        // This lookup ensures the order belongs to this customer.
        Order order = orderRepository
                .findByIdAndUser(orderId, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Order not found for your account"));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == null) {
            throw new IllegalArgumentException(
                    "The current order status is missing");
        }

        if (currentStatus != OrderStatus.PENDING
                && currentStatus != OrderStatus.CONFIRMED) {

            throw new IllegalArgumentException(
                    "You can cancel an order only while it is Pending or Confirmed. Current status: "
                            + currentStatus);
        }

        order.setStatus(OrderStatus.CANCELLED);

        Order cancelledOrder = orderRepository.save(order);

        // Return the updated order with its items and payment details.
        return buildOrderResponse(cancelledOrder);
    }

    // =========================================================
    // ADMIN - GET ALL ORDERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {

        return orderRepository
                .findAllByOrderByIdDesc()
                .stream()
                .map(this::buildOrderResponse)
                .toList();
    }

    // =========================================================
    // ADMIN - GET TODAY'S ORDERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<OrderResponse> getTodayOrders() {

        ZoneId indiaZone = ZoneId.of("Asia/Kolkata");

        LocalDate today = LocalDate.now(indiaZone);
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfTomorrow =
                today.plusDays(1).atStartOfDay();

        return orderRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByIdDesc(
                        startOfDay,
                        startOfTomorrow)
                .stream()
                .map(this::buildOrderResponse)
                .toList();
    }

    // =========================================================
    // ADMIN - GET PARTICULAR ORDER
    // =========================================================

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {

        Order order = orderRepository
                .findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found"));

        return buildOrderResponse(order);
    }

    // =========================================================
    // ADMIN - UPDATE ORDER STATUS
    // BACKEND VALIDATION
    // =========================================================

    @Transactional
    public OrderResponse updateOrderStatus(
            Long orderId,
            OrderStatus status) {

        if (status == null) {
            throw new IllegalArgumentException(
                    "Order status is required");
        }

        Order order = orderRepository
                .findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found"));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == null) {
            throw new IllegalArgumentException(
                    "The current order status is missing");
        }

        if (!isAllowedTransition(currentStatus, status)) {
            throw new IllegalArgumentException(
                    "Invalid order status transition: "
                            + currentStatus + " -> " + status
                            + ". Allowed next statuses: "
                            + getAllowedNextStatuses(currentStatus));
        }

        order.setStatus(status);

        Order updatedOrder = orderRepository.save(order);

        // Mark COD payment as paid when the order is delivered.
        if (status == OrderStatus.DELIVERED) {

            Payment payment = paymentRepository
                    .findByOrder(updatedOrder)
                    .orElse(null);

            if (payment != null
                    && payment.getPaymentMethod() == PaymentMethod.COD) {

                payment.setPaymentStatus(PaymentStatus.PAID);
                paymentRepository.save(payment);
            }
        }

        return buildOrderResponse(updatedOrder);
    }

    // =========================================================
    // CHECK WHETHER AN ADMIN STATUS TRANSITION IS ALLOWED
    // =========================================================

    private boolean isAllowedTransition(
            OrderStatus currentStatus,
            OrderStatus nextStatus) {

        return getAllowedNextStatuses(currentStatus)
                .contains(nextStatus);
    }

    private List<OrderStatus> getAllowedNextStatuses(
            OrderStatus currentStatus) {

        return switch (currentStatus) {

            case PENDING ->
                    List.of(
                            OrderStatus.CONFIRMED,
                            OrderStatus.CANCELLED);

            case CONFIRMED ->
                    List.of(
                            OrderStatus.OUT_FOR_DELIVERY,
                            OrderStatus.CANCELLED);

            case OUT_FOR_DELIVERY ->
                    List.of(
                            OrderStatus.DELIVERED,
                            OrderStatus.CANCELLED);

            case DELIVERED, CANCELLED ->
                    List.of();
        };
    }

    // =========================================================
    // BUILD ORDER RESPONSE
    // =========================================================

    private OrderResponse buildOrderResponse(Order order) {

        List<OrderItem> items =
                orderItemRepository.findByOrderOrderByIdAsc(order);

        Payment payment = paymentRepository
                .findByOrder(order)
                .orElse(null);

        return new OrderResponse(
                order,
                items,
                payment);
    }

    // =========================================================
    // FIND USER
    // =========================================================

    private User getUserByEmail(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));
    }
}