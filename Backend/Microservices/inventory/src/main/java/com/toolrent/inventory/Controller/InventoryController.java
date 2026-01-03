package com.toolrent.inventory.Controller;

import com.toolrent.inventory.Model.InventoryFull;
import com.toolrent.inventory.Service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    // GET

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<InventoryFull>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventoryFull());
    }

    @GetMapping("/check/{toolId}")
    public ResponseEntity<Boolean> checkAvailability(@PathVariable Long toolId) {
        return ResponseEntity.ok(inventoryService.isAvailable(toolId));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<InventoryFull>> filterInventory(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long idTool,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Boolean asc,
            @RequestParam(required = false) Boolean desc,
            @RequestParam(required = false) Boolean recent) {

        return ResponseEntity.ok(inventoryService.filterInventory(state, category, idTool, minPrice, maxPrice, asc, desc, recent));
    }

    // POST

    @PostMapping("/add-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> addStock(@RequestParam Long toolId,
                                         @RequestParam int quantity,
                                         @RequestParam Long userId) {
        inventoryService.addStock(toolId, quantity, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/loan/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Void> loanTool(@PathVariable Long toolId) {
        inventoryService.loanTool(toolId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/return/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Void> returnTool(@PathVariable Long toolId, @RequestParam String targetState) {
        inventoryService.returnTool(toolId, targetState);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/repair/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Void> returnFromRepair(@PathVariable Long toolId) {
        inventoryService.returnFromRepair(toolId);
        return ResponseEntity.ok().build();
    }
}