package com.toolrent.users.Controller;

import com.toolrent.users.Entity.User;
import com.toolrent.users.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    // GET

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<User>> getAllEmployees() {
        return ResponseEntity.ok(userService.getAllEmployees());
    }

    @GetMapping("/clients")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<User>> getAllClients() {
        return ResponseEntity.ok(userService.getAllClients());
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<User>> filterByRole(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(userService.filterByRole(role));
    }

    @GetMapping("/id/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'EMPLOYEE')")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getUserFromJwt(jwt));
    }

    // POST

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        return ResponseEntity.ok(userService.login(credentials.get("username"), credentials.get("password")));
    }

    @PostMapping("/register/client")
    public ResponseEntity<User> registerClient(@RequestBody User user) {
        return ResponseEntity.ok(userService.registerUser(user, "CLIENT"));
    }

    @PostMapping("/register/employee")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<User> registerEmployee(@RequestBody User user) {
        return ResponseEntity.ok(userService.registerUser(user, "EMPLOYEE"));
    }

    @PostMapping("/register/admin")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<User> registerAdmin(@RequestBody User user) {
        return ResponseEntity.ok(userService.registerUser(user, "ADMIN"));
    }

    // PUT

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUser(@RequestBody User userToUpdate, @AuthenticationPrincipal Jwt jwt) {
        try {
            User administrator = userService.getUserFromJwt(jwt);
            User updatedUser = userService.updateUser(userToUpdate, administrator);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // DELETE

    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Boolean> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }
}