package com.chickendelivery.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductImageController {

    private static final String UPLOAD_DIR =
            "uploads/products";

    @PostMapping(
            value = "/upload-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file) {

        try {

            // ============================
            // CHECK FILE
            // ============================

            if (file == null || file.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Please select an image."
                        ));
            }

            // ============================
            // CHECK FILE SIZE
            // ============================

            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Image size must be less than 5 MB."
                        ));
            }

            // ============================
            // CHECK CONTENT TYPE
            // ============================

            String contentType =
                    file.getContentType();

            if (contentType == null ||
                    !isAllowedImageType(contentType)) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Only JPG, JPEG, PNG and WEBP images are allowed."
                        ));
            }

            // ============================
            // GET FILE EXTENSION
            // ============================

            String originalFilename =
                    file.getOriginalFilename();

            String extension =
                    getFileExtension(originalFilename);

            if (extension.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Invalid image file."
                        ));
            }

            // ============================
            // CREATE UNIQUE FILE NAME
            // ============================

            String fileName =
                    UUID.randomUUID()
                            .toString()
                            + extension;

            // ============================
            // CREATE UPLOAD DIRECTORY
            // ============================

            Path uploadPath =
                    Paths.get(UPLOAD_DIR)
                            .toAbsolutePath()
                            .normalize();

            Files.createDirectories(uploadPath);

            // ============================
            // SAVE FILE
            // ============================

            Path targetLocation =
                    uploadPath.resolve(fileName)
                            .normalize();

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // ============================
            // RETURN IMAGE URL
            // ============================

            String imageUrl =
                    "/uploads/products/"
                            + fileName;

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Image uploaded successfully."
            );

            response.put(
                    "imageUrl",
                    imageUrl
            );

            return ResponseEntity.ok(response);

        } catch (IOException e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Unable to upload image."
                    ));
        }
    }

    // ============================
    // ALLOWED IMAGE TYPES
    // ============================

    private boolean isAllowedImageType(
            String contentType) {

        return contentType.equals(
                    MediaType.IMAGE_JPEG_VALUE)
                || contentType.equals(
                    "image/jpg")
                || contentType.equals(
                    MediaType.IMAGE_PNG_VALUE)
                || contentType.equals(
                    "image/webp");
    }

    // ============================
    // FILE EXTENSION
    // ============================

    private String getFileExtension(
            String filename) {

        if (filename == null ||
                filename.isBlank()) {

            return "";
        }

        int lastDot =
                filename.lastIndexOf(".");

        if (lastDot == -1) {
            return "";
        }

        String extension =
                filename.substring(lastDot)
                        .toLowerCase();

        if (extension.equals(".jpeg")) {
            return ".jpg";
        }

        if (extension.equals(".jpg") ||
                extension.equals(".png") ||
                extension.equals(".webp")) {

            return extension;
        }

        return "";
    }
}