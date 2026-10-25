package com.chickendelivery.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.chickendelivery.dto.ProductResponse;
import com.chickendelivery.entity.Product;
import com.chickendelivery.repository.ProductRepository;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    public ProductService(
            ProductRepository productRepository,
            FileStorageService fileStorageService) {

        this.productRepository = productRepository;
        this.fileStorageService = fileStorageService;
    }

    // =========================================================
    // CREATE PRODUCT
    // =========================================================

    public ProductResponse createProduct(
            String name,
            String description,
            BigDecimal price,
            String weight,
            String sellingUnit,
            Boolean active,
            MultipartFile image) {

        validateProduct(
                name,
                price,
                weight,
                sellingUnit
        );

        Product product = new Product();

        product.setName(
                name.trim()
        );

        product.setDescription(
                description != null
                        ? description.trim()
                        : null
        );

        product.setPrice(
                price.setScale(
                        2,
                        java.math.RoundingMode.HALF_UP
                )
        );

        product.setWeight(
                weight.trim()
        );

        product.setSellingUnit(
                normalizeSellingUnit(
                        sellingUnit
                )
        );

        product.setActive(
                active != null
                        ? active
                        : true
        );

        // =====================================================
        // PRODUCT IMAGE
        // =====================================================

        if (image != null && !image.isEmpty()) {

            String imageUrl =
                    fileStorageService.storeProductImage(
                            image
                    );

            product.setImageUrl(
                    imageUrl
            );
        }

        Product savedProduct =
                productRepository.save(product);

        return new ProductResponse(
                savedProduct
        );
    }

    // =========================================================
    // GET ALL PRODUCTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {

        return productRepository
                .findAll()
                .stream()
                .map(ProductResponse::new)
                .toList();
    }

    // =========================================================
    // GET ACTIVE PRODUCTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProducts() {

        return productRepository
                .findByActiveTrueOrderByIdDesc()
                .stream()
                .map(ProductResponse::new)
                .toList();
    }

    // =========================================================
    // GET PRODUCT BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public ProductResponse getProductById(
            Long id) {

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found with id: "
                                                + id
                                )
                        );

        return new ProductResponse(
                product
        );
    }

    // =========================================================
    // UPDATE PRODUCT
    // =========================================================

    public ProductResponse updateProduct(
            Long id,
            String name,
            String description,
            BigDecimal price,
            String weight,
            String sellingUnit,
            Boolean active,
            MultipartFile image) {

        validateProduct(
                name,
                price,
                weight,
                sellingUnit
        );

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found with id: "
                                                + id
                                )
                        );

        product.setName(
                name.trim()
        );

        product.setDescription(
                description != null
                        ? description.trim()
                        : null
        );

        product.setPrice(
                price.setScale(
                        2,
                        java.math.RoundingMode.HALF_UP
                )
        );

        product.setWeight(
                weight.trim()
        );

        product.setSellingUnit(
                normalizeSellingUnit(
                        sellingUnit
                )
        );

        product.setActive(
                active != null
                        ? active
                        : true
        );

        // =====================================================
        // REPLACE IMAGE ONLY WHEN NEW IMAGE IS PROVIDED
        // =====================================================

        if (image != null && !image.isEmpty()) {

            String oldImageUrl =
                    product.getImageUrl();

            String newImageUrl =
                    fileStorageService.storeProductImage(
                            image
                    );

            product.setImageUrl(
                    newImageUrl
            );

            if (oldImageUrl != null
                    && !oldImageUrl.isBlank()) {

                fileStorageService.deleteProductImage(
                        oldImageUrl
                );
            }
        }

        Product updatedProduct =
                productRepository.save(
                        product
                );

        return new ProductResponse(
                updatedProduct
        );
    }

    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    public void deleteProduct(
            Long id) {

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found with id: "
                                                + id
                                )
                        );

        String imageUrl =
                product.getImageUrl();

        productRepository.delete(
                product
        );

        if (imageUrl != null
                && !imageUrl.isBlank()) {

            fileStorageService.deleteProductImage(
                    imageUrl
            );
        }
    }

    // =========================================================
    // VALIDATE PRODUCT
    // =========================================================

    private void validateProduct(
            String name,
            BigDecimal price,
            String weight,
            String sellingUnit) {

        if (name == null
                || name.isBlank()) {

            throw new IllegalArgumentException(
                    "Product name is required"
            );
        }

        if (price == null
                || price.compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            throw new IllegalArgumentException(
                    "Product price must be greater than 0"
            );
        }

        if (weight == null
                || weight.isBlank()) {

            throw new IllegalArgumentException(
                    "Product weight is required"
            );
        }

        normalizeSellingUnit(
                sellingUnit
        );
    }

    // =========================================================
    // NORMALIZE SELLING UNIT
    // =========================================================

    private String normalizeSellingUnit(
            String sellingUnit) {

        if (sellingUnit == null
                || sellingUnit.isBlank()) {

            throw new IllegalArgumentException(
                    "Selling unit is required"
            );
        }

        String unit =
                sellingUnit
                        .trim()
                        .toUpperCase();

        if (!unit.equals("KG")
                && !unit.equals("PIECE")) {

            throw new IllegalArgumentException(
                    "Selling unit must be KG or PIECE"
            );
        }

        return unit;
    }
}