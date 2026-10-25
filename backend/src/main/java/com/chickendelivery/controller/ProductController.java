package com.chickendelivery.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.chickendelivery.dto.ProductResponse;
import com.chickendelivery.service.ProductService;

@RestController
@RequestMapping("/api/admin/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // =========================================================
    // CREATE PRODUCT
    // =========================================================

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> createProduct(

            @RequestParam("name")
            String name,

            @RequestParam(value = "description", required = false)
            String description,

            @RequestParam("price")
            BigDecimal price,

            @RequestParam("weight")
            String weight,

            @RequestParam("sellingUnit")
            String sellingUnit,

            @RequestParam(value = "active", required = false)
            Boolean active,

            @RequestParam(value = "image", required = false)
            MultipartFile image) {

        ProductResponse product =
                productService.createProduct(
                        name,
                        description,
                        price,
                        weight,
                        sellingUnit,
                        active,
                        image
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);

        response.put(
                "message",
                "Product created successfully"
        );

        response.put(
                "product",
                product
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // GET ALL PRODUCTS
    // =========================================================

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts() {

        List<ProductResponse> products =
                productService.getAllProducts();

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Products fetched successfully"
        );

        response.put(
                "count",
                products.size()
        );

        response.put(
                "products",
                products
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // GET PRODUCT BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(
            @PathVariable("id") Long productId) {

        ProductResponse product =
                productService.getProductById(productId);

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Product fetched successfully"
        );

        response.put(
                "product",
                product
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // UPDATE PRODUCT
    // =========================================================

    @PutMapping(
            value = "/{id}",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<Map<String, Object>> updateProduct(

            @PathVariable("id")
            Long productId,

            @RequestParam("name")
            String name,

            @RequestParam(value = "description", required = false)
            String description,

            @RequestParam("price")
            BigDecimal price,

            @RequestParam("weight")
            String weight,

            @RequestParam("sellingUnit")
            String sellingUnit,

            @RequestParam(value = "active", required = false)
            Boolean active,

            @RequestParam(value = "image", required = false)
            MultipartFile image) {

        ProductResponse product =
                productService.updateProduct(
                        productId,
                        name,
                        description,
                        price,
                        weight,
                        sellingUnit,
                        active,
                        image
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Product updated successfully"
        );

        response.put(
                "product",
                product
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(
            @PathVariable("id") Long productId) {

        productService.deleteProduct(productId);

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Product deleted successfully"
        );

        return ResponseEntity.ok(response);
    }
}