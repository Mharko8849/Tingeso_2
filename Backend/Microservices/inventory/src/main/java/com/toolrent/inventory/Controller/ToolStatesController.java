package com.toolrent.inventory.Controller;

import com.toolrent.inventory.Entity.ToolStates;
import com.toolrent.inventory.Service.ToolStatesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tool-states")
public class ToolStatesController {

    @Autowired
    private ToolStatesService toolStatesService;

    // GET

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<ToolStates>> getAllStates() {
        return ResponseEntity.ok(toolStatesService.getAllStates());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<ToolStates> getStateById(@PathVariable Long id) {
        return ResponseEntity.ok(toolStatesService.getStateById(id));
    }

    // POST

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ToolStates> createState(@RequestBody ToolStates state, @RequestParam Long userId) {
        return ResponseEntity.ok(toolStatesService.saveState(state, userId));
    }
}