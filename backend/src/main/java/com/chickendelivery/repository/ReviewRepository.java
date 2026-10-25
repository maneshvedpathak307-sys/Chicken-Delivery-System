package com.chickendelivery.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chickendelivery.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByOrderId(Long orderId);

    Optional<Review> findByOrderIdAndUserId(
            Long orderId,
            Long userId
    );

    List<Review> findAllByOrderByCreatedAtDesc();
}