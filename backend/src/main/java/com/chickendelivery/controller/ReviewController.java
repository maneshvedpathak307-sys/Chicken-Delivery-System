package com.chickendelivery.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chickendelivery.dto.ReviewRequest;
import com.chickendelivery.dto.ReviewResponse;
import com.chickendelivery.service.ReviewService;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // =========================================================
    // CUSTOMER - GET REVIEW FOR AN ORDER
    // =========================================================

    @GetMapping("/reviews/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> getMyReview(
            Authentication authentication,
            @PathVariable Long orderId) {

        ReviewResponse review = reviewService.getMyReview(
                authentication.getName(),
                orderId
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Review information fetched successfully");
        response.put("review", review);

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // CUSTOMER - SUBMIT REVIEW
    // =========================================================

    @PostMapping("/reviews/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> submitReview(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody ReviewRequest request) {

        ReviewResponse review = reviewService.submitReview(
                authentication.getName(),
                orderId,
                request
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Thank you! Your review was submitted.");
        response.put("review", review);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // ADMIN - GET ALL CUSTOMER REVIEWS
    // =========================================================

    @GetMapping("/admin/reviews")
    public ResponseEntity<Map<String, Object>> getAllReviews() {

        List<ReviewResponse> reviews = reviewService.getAllReviews();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Customer reviews fetched successfully");
        response.put("count", reviews.size());
        response.put("reviews", reviews);

        return ResponseEntity.ok(response);
    }
}