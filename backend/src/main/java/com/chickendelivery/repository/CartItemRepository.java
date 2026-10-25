package com.chickendelivery.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chickendelivery.entity.Cart;
import com.chickendelivery.entity.CartItem;
import com.chickendelivery.entity.Product;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);

    List<CartItem> findByCartOrderByIdAsc(Cart cart);

    void deleteByCart(Cart cart);
}