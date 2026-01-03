package com.toolrent.inventory.Service;

import com.toolrent.inventory.Entity.Category;
import com.toolrent.inventory.Model.User;
import com.toolrent.inventory.Repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.users.url}")
    private String usersServiceUrl;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    public Category saveCategory(Category category, Long userId) {

        validateAdmin(userId);

        if (category.getName() == null || category.getName().isBlank()) {
            throw new RuntimeException("El nombre de la categoría no puede estar vacío");
        }

        if (categoryRepository.existsByNameIgnoreCase(category.getName())) {
            throw new RuntimeException("La categoría '" + category.getName() + "' ya existe");
        }

        return categoryRepository.save(category);
    }

    private void validateAdmin(Long userId) {
        if (userId == null) {
            throw new RuntimeException("Usuario no identificado.");
        }
        try {
            String url = usersServiceUrl + "/id/" + userId;
            User user = restTemplate.getForObject(url, User.class);
            if (user == null || (!"ADMIN".equals(user.getRole()) && !"SUPERADMIN".equals(user.getRole()))) {
                throw new RuntimeException("El usuario no tiene permisos de Administrador.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error validando permisos: " + e.getMessage());
        }
    }
}