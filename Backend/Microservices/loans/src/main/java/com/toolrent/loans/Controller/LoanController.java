package com.toolrent.loans.Controller;

import com.toolrent.loans.Entity.Loan;
import com.toolrent.loans.Model.LoanFull;
import com.toolrent.loans.Service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;

@RestController
@RequestMapping("/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    // GET

    @GetMapping("/{idLoan}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<LoanFull> getLoanById(@PathVariable Long idLoan) {
        return ResponseEntity.ok(loanService.getLoanFullById(idLoan));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<LoanFull>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE','SUPERADMIN')")
    public ResponseEntity<List<LoanFull>> filterLoans(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) Long userId) {

        return ResponseEntity.ok(loanService.filterLoans(state, userId));
    }

    // POST

    @PostMapping("/create/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Loan> createLoan(
            @PathVariable Long userId,
            @RequestParam Long employeeId,
            @RequestParam Date initDate,
            @RequestParam Date returnDate) {

        Loan loan = loanService.createLoan(userId, employeeId, initDate, returnDate);
        return ResponseEntity.ok(loan);
    }

    // PUT

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Boolean> deleteLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.deleteLoan(id));
    }
}