package com.chickendelivery.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/products}")
    private String uploadDirectory;

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry) {

        String uploadLocation =
                Paths.get(uploadDirectory)
                        .toAbsolutePath()
                        .normalize()
                        .toUri()
                        .toString();

        if (!uploadLocation.endsWith("/")) {
            uploadLocation += "/";
        }

        registry
                .addResourceHandler(
                        "/uploads/products/**"
                )
                .addResourceLocations(
                        uploadLocation
                );
    }
}