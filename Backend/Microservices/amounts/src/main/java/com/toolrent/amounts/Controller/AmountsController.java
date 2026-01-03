package com.toolrent.amounts.Controller;

import com.toolrent.amounts.Entity.Amounts;
import com.toolrent.amounts.Service.AmountsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/amounts")
public class AmountsController {

    @Autowired
    private AmountsService amountsService;

    // GET

    @GetMapping("/tool/{toolId}")
    public ResponseEntity<Amounts> getAmountsByToolId(@PathVariable Long toolId) {
        return ResponseEntity.ok(amountsService.getAmountsByToolId(toolId));
    }

    // POST

    @PostMapping("/create/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> createAmounts(@PathVariable Long toolId, @RequestBody Amounts amounts) {
        amountsService.createAmounts(toolId, amounts);
        return ResponseEntity.ok().build();
    }

    // PUT

    @PutMapping("/update/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> updateAmounts(@PathVariable Long toolId, @RequestBody Amounts amounts) {
        amountsService.updateAmounts(toolId, amounts);
        return ResponseEntity.ok().build();
    }
}