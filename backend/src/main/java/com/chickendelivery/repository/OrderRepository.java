package com.chickendelivery.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.chickendelivery.entity.Order;
import com.chickendelivery.entity.OrderStatus;
import com.chickendelivery.entity.User;

@Repository
public interface OrderRepository
        extends JpaRepository<Order, Long> {


    // =========================================================
    // CUSTOMER ORDER HISTORY
    // =========================================================

    List<Order> findByUserOrderByIdDesc(
            User user
    );


    // =========================================================
    // FIND CUSTOMER'S PARTICULAR ORDER
    // =========================================================

    Optional<Order> findByIdAndUser(
            Long id,
            User user
    );


    // =========================================================
    // ALL ORDERS - ADMIN
    // =========================================================

    List<Order> findAllByOrderByIdDesc();


    // =========================================================
    // TODAY'S ORDERS - ADMIN
    // =========================================================

    List<Order>
    findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByIdDesc(
            LocalDateTime startOfDay,
            LocalDateTime startOfTomorrow
    );


    // =========================================================
    // TODAY'S TOTAL ORDERS
    // =========================================================

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            LocalDateTime startOfDay,
            LocalDateTime startOfTomorrow
    );


    // =========================================================
    // TODAY'S ORDERS BY STATUS
    // =========================================================

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            OrderStatus status,
            LocalDateTime startOfDay,
            LocalDateTime startOfTomorrow
    );


    // =========================================================
    // TODAY'S UNIQUE CUSTOMERS
    //
    // If one customer places:
    //
    // Order #1
    // Order #2
    // Order #3
    //
    // They are counted as ONE customer.
    // =========================================================

    @Query("""
        SELECT COUNT(DISTINCT o.user.id)
        FROM Order o
        WHERE o.createdAt >= :startOfDay
        AND o.createdAt < :startOfTomorrow
    """)
    long countDistinctCustomersByCreatedAtBetween(
            @Param("startOfDay")
            LocalDateTime startOfDay,

            @Param("startOfTomorrow")
            LocalDateTime startOfTomorrow
    );


    // =========================================================
    // TODAY'S REVENUE
    //
    // Only DELIVERED orders are counted.
    // =========================================================

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.status = :status
        AND o.createdAt >= :startOfDay
        AND o.createdAt < :startOfTomorrow
    """)
    BigDecimal getRevenueByStatusAndDateRange(
            @Param("status")
            OrderStatus status,

            @Param("startOfDay")
            LocalDateTime startOfDay,

            @Param("startOfTomorrow")
            LocalDateTime startOfTomorrow
    );
}