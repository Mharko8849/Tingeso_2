package com.toolrent.clients.Controller;

import com.toolrent.clients.Model.ClientFull;
import com.toolrent.clients.Service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clients")
public class ClientController {

    @Autowired
    private ClientService clientService;

    // GET

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<ClientFull>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ClientFull> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'EMPLOYEE')")
    public ResponseEntity<ClientFull> getClientByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(clientService.getClientByUserId(userId));
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<ClientFull>> filterByState(@RequestParam(required = false) String state) {
        return ResponseEntity.ok(clientService.filterByState(state));
    }

    @GetMapping("/validate/{userId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Boolean> canDoAnotherLoan(@PathVariable Long userId) {
        return ResponseEntity.ok(clientService.canDoAnotherLoan(userId));
    }

    // POST

    @PostMapping("/create/{userId}")
    public ResponseEntity<Void> createClient(@PathVariable Long userId) {
        clientService.createClient(userId);
        return ResponseEntity.ok().build();
    }

    // PUT

    @PutMapping("/loans/increment/{userId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> incrementLoans(@PathVariable Long userId) {
        clientService.incrementLoansCount(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/loans/decrement/{userId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> decrementLoans(@PathVariable Long userId) {
        clientService.decrementLoansCount(userId);
        return ResponseEntity.ok().build();
    }

}