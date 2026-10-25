package com.chickendelivery.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chickendelivery.dto.ReviewRequest;
import com.chickendelivery.dto.ReviewResponse;
import com.chickendelivery.entity.Order;
import com.chickendelivery.entity.OrderStatus;
import com.chickendelivery.entity.Review;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.OrderRepository;
import com.chickendelivery.repository.ReviewRepository;
import com.chickendelivery.repository.UserRepository;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            OrderRepository orderRepository,
            UserRepository userRepository) {

        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // CUSTOMER - SUBMIT REVIEW
    // =========================================================

    @Transactional
    public ReviewResponse submitReview(
            String email,
            Long orderId,
            ReviewRequest request) {

        User user = getUserByEmail(email);

        if (request.getRating() == null
                || request.getRating() < 1
                || request.getRating() > 5) {

            throw new IllegalArgumentException(
                    "Please select a rating between 1 and 5 stars."
            );
        }

        Order order = orderRepository
                .findByIdAndUser(orderId, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Order not found for your account."
                        )
                );

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException(
                    "You can review an order only after it is delivered."
            );
        }

        if (reviewRepository.existsByOrderId(orderId)) {
            throw new IllegalArgumentException(
                    "You have already reviewed this order."
            );
        }

        Review review = new Review();
        review.setOrder(order);
        review.setUser(user);
        review.setRating(request.getRating());

        String comment = request.getComment();

        review.setComment(
                comment == null ? "" : comment.trim()
        );

        try {
            Review savedReview = reviewRepository.saveAndFlush(review);
            return new ReviewResponse(savedReview);
        } catch (DataIntegrityViolationException ex) {
            // The database unique constraint also prevents duplicates
            // if two submissions happen at nearly the same time.
            throw new IllegalArgumentException(
                    "A review has already been submitted for this order."
            );
        }
    }

    // =========================================================
    // CUSTOMER - GET THEIR REVIEW FOR AN ORDER
    // =========================================================

    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(
            String email,
            Long orderId) {

        User user = getUserByEmail(email);

        // Verify that the order belongs to the authenticated customer.
        orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Order not found for your account."
                        )
                );

        return reviewRepository
                .findByOrderIdAndUserId(orderId, user.getId())
                .map(ReviewResponse::new)
                .orElse(null);
    }

    // =========================================================
    // ADMIN - GET ALL REVIEWS
    // =========================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews() {

        return reviewRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ReviewResponse::new)
                .toList();
    }

    // =========================================================
    // FIND USER
    // =========================================================

    private User getUserByEmail(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found.")
                );
    }
}