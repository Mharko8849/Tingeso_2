package com.toolrent.loans.Controller;

import com.toolrent.loans.Entity.LoanTool;
import com.toolrent.loans.Model.LoanToolFull;
import com.toolrent.loans.Service.LoanToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loan-tools")
public class LoanToolController {

    @Autowired
    private LoanToolService loanToolService;

    // GET

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<LoanToolFull>> getAllLoanTools() {
        return ResponseEntity.ok(loanToolService.getAllLoanTools());
    }

    @GetMapping("/loan/{idLoan}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<LoanToolFull>> getByLoan(@PathVariable Long idLoan) {
        return ResponseEntity.ok(loanToolService.getByLoanId(idLoan));
    }

    @GetMapping("/user/{idUser}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<List<LoanToolFull>> getAllLoanToolsByUser(@PathVariable Long idUser) {
        return ResponseEntity.ok(loanToolService.getByUserId(idUser));
    }

    @GetMapping("/total/{idLoan}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Integer> getTotal(@PathVariable Long idLoan) {
        Integer total = loanToolService.getTotalDebt(idLoan);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/total/fine/{idLoan}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Integer> getTotalFine(@PathVariable Long idLoan) {
        Integer total = loanToolService.getTotalFine(idLoan);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/fine/{loanToolId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Integer> getFinePreview(@PathVariable Long loanToolId, @RequestParam String state) {
        return ResponseEntity.ok(loanToolService.getFinePreview(loanToolId, state));
    }

    @GetMapping("/validate/{userId}/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Boolean> validateToolForUser(@PathVariable Long userId, @PathVariable Long toolId) {
        return ResponseEntity.ok(loanToolService.isToolLoanedToUser(toolId, userId));
    }

    // POST

    @PostMapping("/add/{loanId}/{toolId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<?> createLoanTool(@PathVariable Long loanId, @PathVariable Long toolId) {
        try {
            return ResponseEntity.ok(loanToolService.createLoanTool(loanId, toolId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/give/{loanToolId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<LoanTool> giveLoanTool(@PathVariable Long loanToolId, @RequestParam Long employeeId) {
        return ResponseEntity.ok(loanToolService.giveLoanTool(employeeId, loanToolId));
    }

    @PostMapping("/give/all")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<LoanTool>> giveAllLoanTools(@RequestParam Long employeeId, @RequestBody List<Long> loanToolIds) {
        return ResponseEntity.ok(loanToolService.giveAllLoanTools(employeeId, loanToolIds));
    }

    @PostMapping("/receive/{loanToolId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<LoanTool> receiveLoanTool(
            @PathVariable Long loanToolId,
            @RequestParam Long employeeId,
            @RequestParam String stateTool) {
        return ResponseEntity.ok(loanToolService.receiveLoanTool(employeeId, loanToolId, stateTool));
    }

    @PostMapping("/receive/all/{loanId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<List<LoanTool>> receiveAllTools(
            @PathVariable Long loanId,
            @RequestParam Long employeeId,
            @RequestBody Map<String, String> stateMap) {

        return ResponseEntity.ok(loanToolService.receiveAllLoanTools(employeeId, loanId, stateMap));
    }

    @PostMapping("/pay/{loanId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Boolean> payDebt(@PathVariable Long loanId, @RequestParam Long employeeId) {
        return ResponseEntity.ok(loanToolService.payDebt(loanId, employeeId));
    }

    @PostMapping("/pay/repair/{loanId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Boolean> payRepair(@PathVariable Long loanId, @RequestBody Map<String, Object> body) {
        Object adminObj = body.get("adminUser");
        Object costObj = body.get("cost");

        if (adminObj == null || costObj == null) {
            throw new IllegalArgumentException("adminUser y cost son obligatorios");
        }

        Long adminUser = ((Number) adminObj).longValue();
        int cost = ((Number) costObj).intValue();

        return ResponseEntity.ok(loanToolService.payRepairTool(loanId, adminUser, cost));
    }
}