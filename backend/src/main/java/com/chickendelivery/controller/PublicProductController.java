package com.chickendelivery.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chickendelivery.dto.ProductResponse;
import com.chickendelivery.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class PublicProductController {

    private final ProductService productService;

    public PublicProductController(
            ProductService productService) {

        this.productService = productService;
    }

    // =========================
    // CUSTOMER PRODUCT CATALOG
    // =========================

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts() {

        List<ProductResponse> products =
                productService.getActiveProducts();

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Products fetched successfully"
        );
        response.put("count", products.size());
        response.put("products", products);

        return ResponseEntity.ok(response);
    }
}