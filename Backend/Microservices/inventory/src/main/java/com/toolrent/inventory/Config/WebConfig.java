package com.toolrent.inventory.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /images/** URL to the file system
        // In Kubernetes: mounted at /app/images
        // In local dev: file:images/ (relative path)
        String imagesPath = System.getenv("IMAGES_PATH") != null
                ? System.getenv("IMAGES_PATH")
                : "file:images/";

        registry.addResourceHandler("/images/**")
                .addResourceLocations(imagesPath);
    }
}
