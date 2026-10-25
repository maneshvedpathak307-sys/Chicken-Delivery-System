package com.chickendelivery.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chickendelivery.dto.AdminUserResponse;
import com.chickendelivery.entity.OrderStatus;
import com.chickendelivery.entity.ReturnRequestStatus;
import com.chickendelivery.entity.Role;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.OrderRepository;
import com.chickendelivery.repository.ReturnRequestRepository;
import com.chickendelivery.repository.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReturnRequestRepository returnRequestRepository;

    private static final ZoneId BUSINESS_ZONE =
            ZoneId.of("Asia/Kolkata");

    /*
     * A return is counted after pickup or when a refund is pending
     * or completed.
     */
    private static final List<ReturnRequestStatus> RETURNED_STATUSES =
            List.of(
                    ReturnRequestStatus.PICKED_UP,
                    ReturnRequestStatus.REFUND_PENDING,
                    ReturnRequestStatus.REFUNDED
            );

    public AdminService(
            UserRepository userRepository,
            OrderRepository orderRepository,
            ReturnRequestRepository returnRequestRepository
    ) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.returnRequestRepository = returnRequestRepository;
    }

    // ADMIN DASHBOARD STATISTICS

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        return buildDailyStats(LocalDate.now(BUSINESS_ZONE));
    }

    // REPORT STATISTICS

    @Transactional(readOnly = true)
    public Map<String, Object> getReportStats(LocalDate selectedDate) {
        if (selectedDate == null) {
            throw new IllegalArgumentException(
                    "Please select a report date."
            );
        }

        return buildDailyStats(selectedDate);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTodayReportStats() {
        return getReportStats(LocalDate.now(BUSINESS_ZONE));
    }

    // BUILD DAILY STATISTICS

    private Map<String, Object> buildDailyStats(LocalDate selectedDate) {

        LocalDateTime startOfDay =
                selectedDate.atStartOfDay();

        LocalDateTime startOfTomorrow =
                selectedDate.plusDays(1).atStartOfDay();

        // All orders created on the selected date.
        long todayOrders =
                orderRepository
                        .countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                startOfDay,
                                startOfTomorrow
                        );

        // Customers who placed orders on the selected date.
        long todayCustomers =
                orderRepository
                        .countDistinctCustomersByCreatedAtBetween(
                                startOfDay,
                                startOfTomorrow
                        );

        // Orders awaiting confirmation.
        long pendingOrders =
                orderRepository
                        .countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                OrderStatus.PENDING,
                                startOfDay,
                                startOfTomorrow
                        );

        // Orders whose current status is DELIVERED.
        long grossDeliveredOrders =
                orderRepository
                        .countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                OrderStatus.DELIVERED,
                                startOfDay,
                                startOfTomorrow
                        );

        // Cancelled orders.
        long cancelledOrders =
                orderRepository
                        .countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                OrderStatus.CANCELLED,
                                startOfDay,
                                startOfTomorrow
                        );

        // Count unique orders that have reached return/pickup.
        long returnedOrders =
                returnRequestRepository
                        .countDistinctReturnedOrdersForOrderDate(
                                startOfDay,
                                startOfTomorrow,
                                RETURNED_STATUSES
                        );

        // Count delivered orders that also have qualifying returns.
        long deliveredOrdersWithReturns =
                returnRequestRepository
                        .countDistinctDeliveredOrdersWithReturns(
                                OrderStatus.DELIVERED,
                                startOfDay,
                                startOfTomorrow,
                                RETURNED_STATUSES
                        );

        // Delivered count excludes qualifying returned orders.
        long deliveredOrders = Math.max(
                0L,
                grossDeliveredOrders - deliveredOrdersWithReturns
        );

        // Gross delivered revenue for orders created on this date.
        BigDecimal grossDeliveredRevenue =
                orderRepository.getRevenueByStatusAndDateRange(
                        OrderStatus.DELIVERED,
                        startOfDay,
                        startOfTomorrow
                );

        if (grossDeliveredRevenue == null) {
            grossDeliveredRevenue = BigDecimal.ZERO;
        }

        // Deduct only completed refunds from revenue.
        BigDecimal completedRefunds =
                returnRequestRepository.sumRefundedAmountForOrderDate(
                        ReturnRequestStatus.REFUNDED,
                        startOfDay,
                        startOfTomorrow
                );

        if (completedRefunds == null) {
            completedRefunds = BigDecimal.ZERO;
        }

        BigDecimal todayRevenue =
                grossDeliveredRevenue.subtract(completedRefunds);

        // Revenue must not become negative.
        if (todayRevenue.signum() < 0) {
            todayRevenue = BigDecimal.ZERO;
        }

        // Number of unique orders with a completed refund.
        long refundsCount =
                returnRequestRepository
                        .countDistinctReturnedOrdersForOrderDate(
                                startOfDay,
                                startOfTomorrow,
                                List.of(ReturnRequestStatus.REFUNDED)
                        );

        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("todayCustomers", todayCustomers);
        stats.put("todayOrders", todayOrders);
        stats.put("pendingOrders", pendingOrders);

        // Both keys support existing frontend code.
        stats.put("completedOrders", deliveredOrders);
        stats.put("deliveredOrders", deliveredOrders);

        stats.put("cancelledOrders", cancelledOrders);
        stats.put("returnedOrders", returnedOrders);
        stats.put("refundsCount", refundsCount);

        stats.put("grossDeliveredRevenue", grossDeliveredRevenue);
        stats.put("totalRefundedAmount", completedRefunds);
        stats.put("todayRevenue", todayRevenue);

        stats.put("date", selectedDate.toString());

        return stats;
    }

    // GET ALL USERS

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {

        List<User> users =
                userRepository.findAllByOrderByIdDesc();

        return users.stream()
                .map(AdminUserResponse::new)
                .collect(Collectors.toList());
    }

    // ACTIVATE / DEACTIVATE USER

    @Transactional
    public AdminUserResponse updateUserStatus(
            Long userId,
            Boolean active
    ) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "User not found with id: " + userId
                                )
                        );

        user.setActive(active);

        User updatedUser =
                userRepository.save(user);

        return new AdminUserResponse(updatedUser);
    }

    // DELETE USER

    @Transactional
    public void deleteUser(Long userId) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "User not found with id: " + userId
                                )
                        );

        // Do not allow deleting an admin.
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException(
                    "Admin user cannot be deleted"
            );
        }

        userRepository.delete(user);
    }
}