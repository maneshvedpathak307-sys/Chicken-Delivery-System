package com.chickendelivery.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private final Path uploadDirectory;

    public FileStorageService(
            @Value("${app.upload.dir:uploads/products}") String uploadDir) {

        this.uploadDirectory =
                Paths.get(uploadDir)
                        .toAbsolutePath()
                        .normalize();

        try {
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Could not create product upload directory.",
                    e
            );
        }
    }

    // =========================
    // STORE PRODUCT IMAGE
    // =========================

    public String storeProductImage(
            MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Product image is required."
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null ||
                !isAllowedImageType(contentType)) {

            throw new IllegalArgumentException(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
            );
        }

        String originalFilename =
                StringUtils.cleanPath(
                        file.getOriginalFilename() == null
                                ? ""
                                : file.getOriginalFilename()
                );

        String extension =
                getExtension(
                        originalFilename,
                        contentType
                );

        String newFilename =
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        + extension;

        Path target =
                uploadDirectory
                        .resolve(newFilename)
                        .normalize();

        // Security check
        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException(
                    "Invalid file path."
            );
        }

        try (InputStream inputStream =
                     file.getInputStream()) {

            Files.copy(
                    inputStream,
                    target,
                    StandardCopyOption.REPLACE_EXISTING
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Could not save product image.",
                    e
            );
        }

        return "/uploads/products/" + newFilename;
    }

    // =========================
    // DELETE UPLOADED IMAGE
    // =========================

    public void deleteProductImage(
            String imageUrl) {

        if (imageUrl == null ||
                imageUrl.isBlank()) {

            return;
        }

        if (!imageUrl.startsWith(
                "/uploads/products/")) {

            // Do not delete old React/local images
            return;
        }

        String filename =
                imageUrl.substring(
                        "/uploads/products/".length()
                );

        if (filename.isBlank()) {
            return;
        }

        Path target =
                uploadDirectory
                        .resolve(filename)
                        .normalize();

        if (!target.startsWith(uploadDirectory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            // Do not stop product deletion because
            // image deletion failed.
            System.err.println(
                    "Could not delete image: "
                    + e.getMessage()
            );
        }
    }

    // =========================
    // IMAGE TYPE
    // =========================

    private boolean isAllowedImageType(
            String contentType) {

        return contentType.equalsIgnoreCase(
                    "image/jpeg"
                )
                || contentType.equalsIgnoreCase(
                    "image/png"
                )
                || contentType.equalsIgnoreCase(
                    "image/webp"
                );
    }

    // =========================
    // FILE EXTENSION
    // =========================

    private String getExtension(
            String filename,
            String contentType) {

        String extension = "";

        int dotIndex =
                filename.lastIndexOf(".");

        if (dotIndex >= 0 &&
                dotIndex < filename.length() - 1) {

            extension =
                    filename
                            .substring(dotIndex)
                            .toLowerCase();
        }

        if (extension.equals(".jpg") ||
                extension.equals(".jpeg") ||
                extension.equals(".png") ||
                extension.equals(".webp")) {

            return extension;
        }

        if ("image/png".equalsIgnoreCase(
                contentType)) {

            return ".png";
        }

        if ("image/webp".equalsIgnoreCase(
                contentType)) {

            return ".webp";
        }

        return ".jpg";
    }

    // =========================
    // GET DIRECTORY
    // =========================

    public Path getUploadDirectory() {
        return uploadDirectory;
    }
}