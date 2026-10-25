package com.chickendelivery.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chickendelivery.dto.AddToCartRequest;
import com.chickendelivery.dto.CartResponse;
import com.chickendelivery.dto.UpdateCartItemRequest;
import com.chickendelivery.service.CartService;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // ---------------------------------------------------------
    // HELPER: CHECK AUTHENTICATION
    // ---------------------------------------------------------

    private String getAuthenticatedEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {

            throw new org.springframework.security.authentication
                    .AuthenticationCredentialsNotFoundException(
                            "Please log in to access your cart."
                    );
        }

        return authentication.getName();
    }

    // ---------------------------------------------------------
    // GET CART
    // GET /api/cart
    // ---------------------------------------------------------

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCart(
            Authentication authentication) {

        String email = getAuthenticatedEmail(authentication);

        CartResponse cart = cartService.getCart(email);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Cart fetched successfully");
        response.put("cart", cart);

        return ResponseEntity.ok(response);
    }

    // ---------------------------------------------------------
    // ADD PRODUCT TO CART
    // POST /api/cart/items
    // ---------------------------------------------------------

    @PostMapping("/items")
    public ResponseEntity<Map<String, Object>> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request) {

        String email = getAuthenticatedEmail(authentication);

        CartResponse cart = cartService.addToCart(email, request);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Product added to cart successfully");
        response.put("cart", cart);

        return ResponseEntity.ok(response);
    }

    // ---------------------------------------------------------
    // UPDATE QUANTITY
    // PUT /api/cart/items/{productId}
    // ---------------------------------------------------------

    @PutMapping("/items/{productId}")
    public ResponseEntity<Map<String, Object>> updateQuantity(
            Authentication authentication,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemRequest request) {

        String email = getAuthenticatedEmail(authentication);

        CartResponse cart = cartService.updateQuantity(
                email,
                productId,
                request
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Cart quantity updated successfully");
        response.put("cart", cart);

        return ResponseEntity.ok(response);
    }

    // ---------------------------------------------------------
    // REMOVE ONE PRODUCT
    // DELETE /api/cart/items/{productId}
    // ---------------------------------------------------------

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Map<String, Object>> removeItem(
            Authentication authentication,
            @PathVariable Long productId) {

        String email = getAuthenticatedEmail(authentication);

        CartResponse cart = cartService.removeItem(email, productId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Product removed from cart successfully");
        response.put("cart", cart);

        return ResponseEntity.ok(response);
    }

    // ---------------------------------------------------------
    // CLEAR CART
    //
    // Supports BOTH:
    // DELETE /api/cart
    // DELETE /api/cart/clear
    //
    // Both URLs clear only the authenticated user's cart.
    // ---------------------------------------------------------

    @DeleteMapping({"", "/clear"})
    public ResponseEntity<Map<String, Object>> clearCart(
            Authentication authentication) {

        String email = getAuthenticatedEmail(authentication);

        CartResponse cart = cartService.clearCart(email);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Cart cleared successfully");
        response.put("cart", cart);

        return ResponseEntity.ok(response);
    }
}