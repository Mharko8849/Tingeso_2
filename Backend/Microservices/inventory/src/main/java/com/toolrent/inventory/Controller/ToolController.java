package com.toolrent.inventory.Controller;

import com.toolrent.inventory.Entity.Tool;
import com.toolrent.inventory.Model.ToolFull;
import com.toolrent.inventory.Model.ToolInput;
import com.toolrent.inventory.Service.ToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tools")
public class ToolController {

    @Autowired
    private ToolService toolService;

    // GET

    @GetMapping
    public ResponseEntity<List<ToolFull>> getAllTools() {
        return ResponseEntity.ok(toolService.getAllTools());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ToolFull> getToolById(@PathVariable Long id) {
        return ResponseEntity.ok(toolService.getToolById(id));
    }

    // POST

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Tool> createTool(@RequestBody ToolInput input, @RequestParam Long userId) {
        return ResponseEntity.ok(toolService.createTool(input.getTool(), input.getAmounts(), userId));
    }

    // PUT

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Tool> updateTool(@PathVariable Long id,
                                           @RequestBody ToolInput request,
                                           @RequestParam Long userId) {
        return ResponseEntity.ok(toolService.updateTool(id, request.getTool(), request.getAmounts(), userId));
    }
}