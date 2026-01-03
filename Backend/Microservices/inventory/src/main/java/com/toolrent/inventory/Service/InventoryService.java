package com.toolrent.inventory.Service;

import com.toolrent.inventory.Entity.Inventory;
import com.toolrent.inventory.Entity.Tool;
import com.toolrent.inventory.Entity.ToolStates;
import com.toolrent.inventory.Model.InventoryFull;
import com.toolrent.inventory.Model.Kardex;
import com.toolrent.inventory.Model.ToolFull;
import com.toolrent.inventory.Model.User;
import com.toolrent.inventory.Repository.InventoryRepository;
import com.toolrent.inventory.Repository.ToolRepository;
import com.toolrent.inventory.Repository.ToolStatesRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    @Autowired
    InventoryRepository inventoryRepository;

    @Autowired
    ToolStatesRepository toolStatesRepository;

    @Autowired
    ToolRepository toolRepository;

    @Autowired
    ToolService toolService;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.kardex.url}")
    private String kardexServiceUrl;

    @Value("${microservices.users.url}")
    private String usersServiceUrl;

    public List<InventoryFull> getAllInventoryFull() {
        List<Inventory> inventories = inventoryRepository.findAll();
        return inventories.stream()
                .map(this::mapToInventoryFull)
                .collect(Collectors.toList());
    }

    public boolean isAvailable(Long toolId) {
        Inventory inv = getInventoryRecord(toolId, "DISPONIBLE");
        return inv.getStockTool() >= 1;
    }


    @Transactional
    public void loanTool(Long toolId) {
        moveStock(toolId, "DISPONIBLE", "PRESTADA");
    }

    @Transactional
    public void returnTool(Long toolId, String targetState) {
        moveStock(toolId, "PRESTADA", targetState);
    }

    @Transactional
    public void sendToRepair(Long toolId) {
        moveStock(toolId, "DISPONIBLE", "EN REPARACION");
    }

    @Transactional
    public void returnFromRepair(Long toolId) {
        moveStock(toolId, "EN REPARACION", "DISPONIBLE");
    }

    private void moveStock(Long toolId, String fromState, String toState) {
        Inventory init = getInventoryRecord(toolId, fromState);
        Inventory destiny = getInventoryRecord(toolId, toState);

        if (init.getStockTool() < 1) {
            throw new RuntimeException("No hay stock en estado '" + fromState + "' para mover a '" + toState + "'.");
        }

        init.setStockTool(init.getStockTool() - 1);
        destiny.setStockTool(destiny.getStockTool() + 1);

        inventoryRepository.save(init);
        inventoryRepository.save(destiny);
    }

    @Transactional
    public void addStock(Long toolId, int quantity, Long employeeId) {

        validateAdmin(employeeId);

        if (quantity <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }

        Inventory availableInv = getInventoryRecord(toolId, "DISPONIBLE");
        availableInv.setStockTool(availableInv.getStockTool() + quantity);
        inventoryRepository.save(availableInv);

        try {
            // Estilo HttpEntity
            Kardex newKardex = new Kardex();
            newKardex.setToolId(toolId);
            newKardex.setType("INGRESO");
            newKardex.setCant(quantity);
            newKardex.setEmployeeId(employeeId);
            newKardex.setActualDate(new Date());
            newKardex.setUserId(null);
            newKardex.setCost(null);

            HttpEntity<Kardex> request = new HttpEntity<>(newKardex);

            String url = kardexServiceUrl + "/create";
            restTemplate.postForObject(url, request, Void.class);

        } catch (Exception e) {
            System.err.println("Error registrando en Kardex: " + e.getMessage());
        }
    }

    public List<InventoryFull> filterInventory(String state, String category, Long idTool,
                                               Integer minPrice, Integer maxPrice,
                                               Boolean asc, Boolean desc, Boolean recent) {

        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new RuntimeException("El precio mínimo no puede ser mayor que el precio máximo.");
        }

        boolean isAsc = Boolean.TRUE.equals(asc);
        boolean isDesc = Boolean.TRUE.equals(desc);
        boolean isRecent = Boolean.TRUE.equals(recent);

        if (isAsc && isDesc) {
            isAsc = false;
            isDesc = false;
        }
        if (isAsc && isRecent) {
            isAsc = false;
            isRecent = false;
        }
        if (isDesc && isRecent) {
            isDesc = false;
            isRecent = false;
        }

        List<InventoryFull> fullList = getAllInventoryFull();

        if (state != null && !state.isBlank()) {
            fullList = fullList.stream()
                    .filter(inv -> inv.getToolStateName() != null &&
                            inv.getToolStateName().equalsIgnoreCase(state))
                    .collect(Collectors.toList());
        }

        if (category != null && !category.isBlank()) {
            fullList = fullList.stream()
                    .filter(inv -> inv.getToolFull() != null &&
                            inv.getToolFull().getCategoryName() != null &&
                            inv.getToolFull().getCategoryName().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }

        if (idTool != null) {
            fullList = fullList.stream()
                    .filter(inv -> inv.getToolFull() != null &&
                            inv.getToolFull().getId().equals(idTool))
                    .collect(Collectors.toList());
        }

        if (minPrice != null) {
            fullList = fullList.stream()
                    .filter(inv -> inv.getToolFull() != null &&
                            inv.getToolFull().getAmounts() != null &&
                            inv.getToolFull().getAmounts().getPriceRent() >= minPrice)
                    .collect(Collectors.toList());
        }

        if (maxPrice != null) {
            fullList = fullList.stream()
                    .filter(inv -> inv.getToolFull() != null &&
                            inv.getToolFull().getAmounts() != null &&
                            inv.getToolFull().getAmounts().getPriceRent() <= maxPrice)
                    .collect(Collectors.toList());
        }

        if (isRecent) {
            fullList.sort(Comparator.comparing(InventoryFull::getId).reversed());
        } else if (isAsc) {
            fullList.sort(Comparator.comparingInt(inv ->
                    (inv.getToolFull() != null && inv.getToolFull().getAmounts() != null) ?
                            inv.getToolFull().getAmounts().getPriceRent() : 0));
        } else if (isDesc) {
            fullList.sort((inv1, inv2) -> {
                int p1 = (inv1.getToolFull() != null && inv1.getToolFull().getAmounts() != null) ?
                        inv1.getToolFull().getAmounts().getPriceRent() : 0;
                int p2 = (inv2.getToolFull() != null && inv2.getToolFull().getAmounts() != null) ?
                        inv2.getToolFull().getAmounts().getPriceRent() : 0;
                return Integer.compare(p2, p1);
            });
        }

        return fullList;
    }


    private Inventory getInventoryRecord(Long toolId, String stateName) {
        // Usamos IgnoreCase para encontrar "disponible" o "DISPONIBLE"
        ToolStates state = toolStatesRepository.findByStateIgnoreCase(stateName)
                .orElseThrow(() -> new RuntimeException("Estado '" + stateName + "' no existe en BD."));

        return inventoryRepository.findByToolIdAndToolStateId(toolId, state.getId())
                .orElseThrow(() -> new RuntimeException("No existe registro de inventario para la herramienta " + toolId + " en estado " + stateName));
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

    private InventoryFull mapToInventoryFull(Inventory inventory) {
        ToolFull toolFull = null;

        Tool toolEntity = toolRepository.findById(inventory.getToolId()).orElse(null);
        if (toolEntity != null) {
            toolFull = toolService.mapToToolFull(toolEntity);
        }

        String stateName = null;
        ToolStates state = toolStatesRepository.findById(inventory.getToolStateId()).orElse(null);
        if (state != null) {
            stateName = state.getState();
        }

        return new InventoryFull(
                inventory.getId(),
                toolFull,
                stateName,
                inventory.getStockTool()
        );
    }
}