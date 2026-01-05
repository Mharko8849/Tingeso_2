package com.toolrent.inventory.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Component
public class ImageInitializer implements CommandLineRunner {

    @Value("${IMAGES_PATH:file:images/}")
    private String imagesPathStr;

    @Override
    public void run(String... args) throws Exception {
        // Clean up the path string (remove "file:" prefix if present)
        String cleanPath = imagesPathStr.replace("file:", "");
        Path targetDir = Paths.get(cleanPath);

        // Create the target directory if it doesn't exist
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        // Copy images from classpath to the target directory
        copyInitialImages(targetDir);
    }

    private void copyInitialImages(Path targetDir) {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:initial-images/*.*");

            for (Resource resource : resources) {
                if (resource.exists() && resource.isReadable()) {
                    String filename = resource.getFilename();
                    if (filename != null) {
                        Path targetFile = targetDir.resolve(filename);
                        // Only copy if the file doesn't exist in the target directory
                        if (!Files.exists(targetFile)) {
                            try (InputStream inputStream = resource.getInputStream()) {
                                Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
                                System.out.println("Initialized image: " + filename);
                            } catch (IOException e) {
                                System.err.println("Failed to copy image " + filename + ": " + e.getMessage());
                            }
                        }
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to load initial images from classpath: " + e.getMessage());
        }
    }
}
