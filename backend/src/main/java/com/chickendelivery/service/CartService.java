package com.chickendelivery.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chickendelivery.dto.AddToCartRequest;
import com.chickendelivery.dto.CartItemResponse;
import com.chickendelivery.dto.CartResponse;
import com.chickendelivery.dto.UpdateCartItemRequest;
import com.chickendelivery.entity.Cart;
import com.chickendelivery.entity.CartItem;
import com.chickendelivery.entity.Product;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.CartItemRepository;
import com.chickendelivery.repository.CartRepository;
import com.chickendelivery.repository.ProductRepository;
import com.chickendelivery.repository.UserRepository;

@Service
public class CartService {

    private static final BigDecimal MIN_CHICKEN_QTY =
            new BigDecimal("0.250");

    private static final BigDecimal CHICKEN_STEP =
            new BigDecimal("0.250");

    private final CartRepository cartRepository;

    private final CartItemRepository cartItemRepository;

    private final ProductRepository productRepository;

    private final UserRepository userRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // GET CART
    // =========================================================

    @Transactional
    public CartResponse getCart(String email) {

        User user = getUserByEmail(email);

        Cart cart = getOrCreateCart(user);

        return buildCartResponse(cart);
    }

    // =========================================================
    // ADD TO CART
    // =========================================================

    @Transactional
    public CartResponse addToCart(
            String email,
            AddToCartRequest request) {

        if (request == null
                || request.getProductId() == null) {

            throw new IllegalArgumentException(
                    "Product ID is required");
        }

        if (request.getQuantity() == null) {

            throw new IllegalArgumentException(
                    "Quantity is required");
        }

        User user = getUserByEmail(email);

        Product product =
                productRepository.findById(
                        request.getProductId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found with id: "
                                        + request.getProductId()));

        if (!Boolean.TRUE.equals(product.getActive())) {

            throw new IllegalArgumentException(
                    "This product is currently unavailable");
        }

        // IMPORTANT:
        // Validate quantity on the backend.
        validateQuantity(
                product,
                request.getQuantity()
        );

        Cart cart = getOrCreateCart(user);

        CartItem cartItem =
                cartItemRepository
                        .findByCartAndProduct(
                                cart,
                                product)
                        .orElse(null);

        if (cartItem == null) {

            cartItem = new CartItem();

            cartItem.setCart(cart);

            cartItem.setProduct(product);

            cartItem.setQuantity(
                    normalize(request.getQuantity())
            );

        } else {

            /*
             * If the product already exists in the cart,
             * add the new quantity to the existing quantity.
             *
             * Example:
             *
             * Existing chicken = 0.500 KG
             * Add another      = 0.250 KG
             *
             * New quantity      = 0.750 KG
             */

            BigDecimal newQuantity =
                    cartItem.getQuantity()
                            .add(request.getQuantity());

            validateQuantity(
                    product,
                    newQuantity
            );

            cartItem.setQuantity(
                    normalize(newQuantity)
            );
        }

        cartItemRepository.save(cartItem);

        return buildCartResponse(cart);
    }

    // =========================================================
    // UPDATE QUANTITY
    // =========================================================

    @Transactional
    public CartResponse updateQuantity(
            String email,
            Long productId,
            UpdateCartItemRequest request) {

        if (request == null
                || request.getQuantity() == null) {

            throw new IllegalArgumentException(
                    "Quantity is required");
        }

        User user = getUserByEmail(email);

        Cart cart = getOrCreateCart(user);

        Product product =
                productRepository.findById(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found with id: "
                                        + productId));

        CartItem cartItem =
                cartItemRepository
                        .findByCartAndProduct(
                                cart,
                                product)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product is not available in your cart"));

        // Validate new quantity on backend
        validateQuantity(
                product,
                request.getQuantity()
        );

        cartItem.setQuantity(
                normalize(request.getQuantity())
        );

        cartItemRepository.save(cartItem);

        return buildCartResponse(cart);
    }

    // =========================================================
    // REMOVE ITEM
    // =========================================================

    @Transactional
    public CartResponse removeItem(
            String email,
            Long productId) {

        User user = getUserByEmail(email);

        Cart cart = getOrCreateCart(user);

        Product product =
                productRepository.findById(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found with id: "
                                        + productId));

        CartItem cartItem =
                cartItemRepository
                        .findByCartAndProduct(
                                cart,
                                product)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product is not available in your cart"));

        cartItemRepository.delete(cartItem);

        return buildCartResponse(cart);
    }

    // =========================================================
    // CLEAR CART
    // =========================================================

    @Transactional
    public CartResponse clearCart(String email) {

        User user = getUserByEmail(email);

        Cart cart = getOrCreateCart(user);

        cartItemRepository.deleteByCart(cart);

        return buildCartResponse(cart);
    }

    // =========================================================
    // QUANTITY VALIDATION
    // =========================================================

    private void validateQuantity(
            Product product,
            BigDecimal quantity) {

        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Quantity must be greater than 0");
        }

        String sellingUnit =
                product.getSellingUnit();

        // -----------------------------------------------------
        // EGGS / PIECE PRODUCTS
        // -----------------------------------------------------

        if ("PIECE".equalsIgnoreCase(sellingUnit)) {

            /*
             * Quantity must be a whole number.
             *
             * Valid:
             * 1
             * 2
             * 5
             * 10
             * 12
             *
             * Invalid:
             * 0.5
             * 2.5
             * 5.25
             */

            if (quantity.stripTrailingZeros().scale() > 0) {

                throw new IllegalArgumentException(
                        "Quantity must be a whole number of pieces");
            }

            return;
        }

        // -----------------------------------------------------
        // CHICKEN / KG PRODUCTS
        // -----------------------------------------------------

        /*
         * Minimum chicken quantity = 250 grams.
         *
         * 250 g = 0.250 KG
         */

        if (quantity.compareTo(MIN_CHICKEN_QTY) < 0) {

            throw new IllegalArgumentException(
                    "Chicken minimum quantity is 250 g");
        }

        /*
         * Chicken quantity must increase in 250g steps.
         *
         * Valid:
         * 0.250
         * 0.500
         * 0.750
         * 1.000
         * 1.250
         * 1.500
         *
         * Invalid:
         * 0.300
         * 0.600
         * 0.850
         */

        BigDecimal remainder =
                quantity.remainder(CHICKEN_STEP);

        if (remainder.compareTo(BigDecimal.ZERO) != 0) {

            throw new IllegalArgumentException(
                    "Chicken quantity must be in 250 g steps");
        }
    }

    // =========================================================
    // NORMALIZE QUANTITY
    // =========================================================

    private BigDecimal normalize(BigDecimal value) {

        return value
                .setScale(3, RoundingMode.HALF_UP)
                .stripTrailingZeros();
    }

    // =========================================================
    // FIND USER
    // =========================================================

    private User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }

    // =========================================================
    // GET OR CREATE CART
    // =========================================================

    private Cart getOrCreateCart(User user) {

        return cartRepository
                .findByUser(user)
                .orElseGet(() -> {

                    Cart newCart = new Cart();

                    newCart.setUser(user);

                    return cartRepository.save(newCart);
                });
    }

    // =========================================================
    // BUILD CART RESPONSE
    // =========================================================

    private CartResponse buildCartResponse(Cart cart) {

        List<CartItemResponse> items =
                cartItemRepository
                        .findByCartOrderByIdAsc(cart)
                        .stream()
                        .map(CartItemResponse::new)
                        .toList();

        /*
         * CartItemResponse calculates each item's subtotal:
         *
         * price × quantity
         *
         * Example:
         *
         * Chicken:
         * 280 × 0.500 = 140.00
         *
         * Eggs:
         * 7.50 × 5 = 37.50
         */

        BigDecimal totalAmount =
                items.stream()
                        .map(CartItemResponse::getSubtotal)
                        .filter(subtotal -> subtotal != null)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        CartResponse response =
                new CartResponse();

        response.setCartId(cart.getId());

        response.setUserId(
                cart.getUser().getId()
        );

        response.setItems(items);

        /*
         * Number of different products in the cart.
         *
         * We do NOT add:
         *
         * 0.500 KG + 5 eggs
         *
         * because different selling units cannot be
         * meaningfully combined.
         */
        response.setTotalItems(items.size());

        response.setTotalAmount(totalAmount);

        return response;
    }
}