package com.toolrent.inventory.Service;

import com.toolrent.inventory.Entity.Category;
import com.toolrent.inventory.Entity.Inventory;
import com.toolrent.inventory.Entity.Tool;
import com.toolrent.inventory.Entity.ToolStates;
import com.toolrent.inventory.Model.Amounts;
import com.toolrent.inventory.Model.ToolFull;
import com.toolrent.inventory.Model.User;
import com.toolrent.inventory.Repository.CategoryRepository;
import com.toolrent.inventory.Repository.InventoryRepository;
import com.toolrent.inventory.Repository.ToolRepository;
import com.toolrent.inventory.Repository.ToolStatesRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ToolService {

    @Autowired
    ToolRepository toolRepository;

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    InventoryRepository inventoryRepository;

    @Autowired
    ToolStatesRepository toolStatesRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.amounts.url}")
    private String amountsServiceUrl;

    @Value("${microservices.users.url}")
    private String usersServiceUrl;

    public List<ToolFull> getAllTools() {
        List<Tool> tools = toolRepository.findAll();
        return tools.stream()
                .map(this::mapToToolFull)
                .collect(Collectors.toList());
    }

    public ToolFull getToolById(Long id) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Herramienta no encontrada."));
        return mapToToolFull(tool);
    }

    @Transactional
    public Tool createTool(Tool tool, Amounts amounts, Long userId) {

        validateAdmin(userId);

        if (tool.getToolName() == null || tool.getToolName().isBlank()) {
            throw new RuntimeException("Debe ingresar un nombre para la herramienta.");
        }
        if (tool.getCategoryId() == null) {
            throw new RuntimeException("Debe seleccionar una categoría.");
        }

        Tool savedTool = toolRepository.save(tool);

        List<ToolStates> allStates = toolStatesRepository.findAll();

        if (allStates.isEmpty()) {
            throw new RuntimeException("Error crítico: No hay estados configurados en la base de datos.");
        }

        int i = 0;
        while (i < allStates.size()) {
            ToolStates state = allStates.get(i);

            Inventory inv = new Inventory();
            inv.setToolId(savedTool.getId());
            inv.setToolStateId(state.getId());
            inv.setStockTool(0);

            inventoryRepository.save(inv);
            i+=1;
        }

        if (amounts != null) {
            try {
                String url = amountsServiceUrl + "/create/" + savedTool.getId();
                restTemplate.postForObject(url, amounts, Void.class);
            } catch (Exception e) {
                System.err.println("Error guardando precios: " + e.getMessage());
            }
        }

        return savedTool;
    }

    public Tool updateTool(Long idTool, Tool toolUpdate, Amounts amountsUpdate, Long userId) {

        validateAdmin(userId);

        Tool tool = toolRepository.findById(idTool)
                .orElseThrow(() -> new RuntimeException("Herramienta no encontrada."));

        if (toolUpdate.getToolName() != null && !toolUpdate.getToolName().isBlank()) {
            tool.setToolName(toolUpdate.getToolName());
        }
        if (toolUpdate.getCategoryId() != null) {
            tool.setCategoryId(toolUpdate.getCategoryId());
        }

        Tool savedTool = toolRepository.save(tool);

        if (amountsUpdate != null) {
            try {
                String url = amountsServiceUrl + "/update/" + idTool;
                restTemplate.put(url, amountsUpdate);
            } catch (Exception e) {
                System.err.println("Error actualizando precios: " + e.getMessage());
            }
        }

        return savedTool;
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
            throw new RuntimeException("Error validando permisos de usuario: " + e.getMessage());
        }
    }

    public ToolFull mapToToolFull(Tool tool) {
        Amounts amounts = null;
        String categoryName = null;

        try {
            String url = amountsServiceUrl + "/tool/" + tool.getId();
            amounts = restTemplate.getForObject(url, Amounts.class);
        } catch (Exception e) {

        }

        Category cat = categoryRepository.findById(tool.getCategoryId()).orElse(null);
        if (cat != null) {
            categoryName = cat.getName();
        }

        return new ToolFull(
                tool.getId(),
                tool.getToolName(),
                categoryName,
                amounts
        );
    }
}