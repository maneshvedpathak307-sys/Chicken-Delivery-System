package com.chickendelivery.repository;

import com.chickendelivery.entity.Order;
import com.chickendelivery.entity.OrderItem;
import com.chickendelivery.entity.OrderStatus;
import com.chickendelivery.entity.ReturnRequest;
import com.chickendelivery.entity.ReturnRequestStatus;
import com.chickendelivery.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReturnRequestRepository
        extends JpaRepository<ReturnRequest, Long> {

    List<ReturnRequest> findByUserOrderByCreatedAtDesc(User user);

    List<ReturnRequest> findAllByOrderByCreatedAtDesc();

    List<ReturnRequest> findByOrderItemOrderByCreatedAtDesc(
            OrderItem orderItem
    );

    List<ReturnRequest> findByOrderAndUser(
            Order order,
            User user
    );

    // =========================================================
    // COUNT UNIQUE ORDERS THAT HAVE REACHED RETURN/PICKUP
    // =========================================================

    @Query("""
        SELECT COUNT(DISTINCT r.order.id)
        FROM ReturnRequest r
        WHERE r.order.createdAt >= :startOfDay
          AND r.order.createdAt < :startOfTomorrow
          AND r.status IN :statuses
    """)
    long countDistinctReturnedOrdersForOrderDate(
            @Param("startOfDay")
            LocalDateTime startOfDay,

            @Param("startOfTomorrow")
            LocalDateTime startOfTomorrow,

            @Param("statuses")
            List<ReturnRequestStatus> statuses
    );

    // =========================================================
    // COUNT DELIVERED ORDERS THAT HAVE BEEN RETURNED
    // =========================================================

    @Query("""
        SELECT COUNT(DISTINCT r.order.id)
        FROM ReturnRequest r
        WHERE r.order.status = :orderStatus
          AND r.order.createdAt >= :startOfDay
          AND r.order.createdAt < :startOfTomorrow
          AND r.status IN :returnStatuses
    """)
    long countDistinctDeliveredOrdersWithReturns(
            @Param("orderStatus")
            OrderStatus orderStatus,

            @Param("startOfDay")
            LocalDateTime startOfDay,

            @Param("startOfTomorrow")
            LocalDateTime startOfTomorrow,

            @Param("returnStatuses")
            List<ReturnRequestStatus> returnStatuses
    );

    // =========================================================
    // SUM COMPLETED REFUNDS FOR ORDERS PLACED ON A DATE
    // =========================================================

    @Query("""
        SELECT COALESCE(SUM(r.refundAmount), 0)
        FROM ReturnRequest r
        WHERE r.status = :status
          AND r.order.createdAt >= :startOfDay
          AND r.order.createdAt < :startOfTomorrow
    """)
    BigDecimal sumRefundedAmountForOrderDate(
            @Param("status")
            ReturnRequestStatus status,

            @Param("startOfDay")
            LocalDateTime startOfDay,

            @Param("startOfTomorrow")
            LocalDateTime startOfTomorrow
    );
}