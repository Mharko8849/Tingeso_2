package com.toolrent.users.Service;

import com.toolrent.users.Entity.User;
import com.toolrent.users.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KeycloakAdminService keycloakAdminService;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.clients.url}")
    private String clientsServiceUrl;

    public User registerUser(User user, String roleName) {
        validateNewUser(user);

        String kcId;
        try {
            kcId = keycloakAdminService.createKeycloakUser(user, roleName);
        } catch (Exception ex) {
            logger.error("Error Keycloak: {}", ex.getMessage());
            throw new RuntimeException("Error al crear usuario en el sistema de identidad.");
        }

        user.setKeycloakId(kcId);
        user.setRole(roleName);

        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (Exception ex) {
            logger.error("Error DB: {}", kcId);
            try {
                keycloakAdminService.deleteKeycloakUser(kcId);
            } catch (Exception delEx) {
                logger.error("FATAL: Falló Rollback Keycloak: {}", delEx.getMessage());
            }
            throw new RuntimeException("Error guardando usuario en base de datos.");
        }

        if ("CLIENT".equals(roleName)) {
            try {
                String url = clientsServiceUrl + "/create/" + savedUser.getId();
                restTemplate.postForEntity(url, null, Void.class);
            } catch (Exception e) {
                logger.error("ERROR CRÍTICO: Falló creación ficha cliente ID {}: {}", savedUser.getId(), e.getMessage());
            }
        }

        return savedUser;
    }

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> keycloakResponse;

        try {
            keycloakResponse = keycloakAdminService.requestPasswordGrant(username, password);
        } catch (Exception e) {
            throw new RuntimeException("Usuario o contraseña incorrectos.");
        }

        User loginUser = userRepository.findByUsernameIgnoreCase(username);

        if (loginUser == null) {
            loginUser = userRepository.findByEmail(username);
        }

        if (loginUser == null) {
            logger.error("Inconsistencia: Usuario existe en Keycloak pero no en DB: {}", username);
            throw new RuntimeException("Error de cuenta: Contacte al administrador.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("token_info", keycloakResponse);
        response.put("user", loginUser);

        return response;
    }

    public User updateUser(User user, User administrator) {
        User userUpdate = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado para actualización"));

        validateUpdatePermissions(userUpdate, administrator);

        if (userUpdate.getKeycloakId() == null || userUpdate.getKeycloakId().isBlank()) {
            throw new RuntimeException("Error crítico: El usuario local no está vinculado a Keycloak");
        }

        try {
            keycloakAdminService.updateKeycloakUser(userUpdate.getKeycloakId(), user);
        } catch (Exception e) {
            logger.error("Error Keycloak: {}", e.getMessage());
            throw new RuntimeException("Error al sincronizar actualización con el servidor de identidad.");
        }

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            try {
                keycloakAdminService.resetPassword(userUpdate.getKeycloakId(), user.getPassword());
            } catch (Exception e) {
                logger.error("Error password Keycloak: {}", e.getMessage());
                throw new RuntimeException("Error al actualizar la contraseña.");
            }
        }

        user.setKeycloakId(userUpdate.getKeycloakId());

        if (user.getRole() == null) {
            user.setRole(userUpdate.getRole());
        }

        return userRepository.save(user);
    }

    public boolean deleteUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return false;

        // Borramos en Keycloak
        if (user.getKeycloakId() != null && !user.getKeycloakId().isBlank()) {
            try {
                keycloakAdminService.deleteKeycloakUser(user.getKeycloakId());
            } catch (Exception ex) {
                logger.warn("No se pudo eliminar de Keycloak (posiblemente ya no exista): {}", ex.getMessage());
            }
        }

        // Luego borramos en local
        try {
            userRepository.deleteById(id);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getAllEmployees() {
        List<User> employees = userRepository.findByRole("EMPLOYEE");
        List<User> administrators = userRepository.findByRole("ADMIN");
        List<User> workers = new ArrayList<>();
        workers.addAll(employees);
        workers.addAll(administrators);
        return workers;
    }

    public List<User> getAllClients() {
        return userRepository.findByRole("CLIENT");
    }

    public List<User> filterByRole(String role){
        if (role == null || role.isBlank()){
            return getAllEmployees();
        }else{
            return userRepository.findByRole(role);
        }
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
    }

    /**
     * Obtiene el usuario correspondiente al token JWT.
     */
    public User getUserFromJwt(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autorizado");
        }
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido");
        }
        User user = userRepository.findByKeycloakId(sub);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado en base de datos local");
        }
        return user;
    }

    // Métodos auxiliares

    private void validateNewUser(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new RuntimeException("El nombre de usuario es obligatorio");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new RuntimeException("El email es obligatorio");
        }
        if (user.getRut() == null || user.getRut().isBlank()) {
            throw new RuntimeException("El RUT es obligatorio");
        }
        if (user.getName() == null || user.getName().isBlank()) {
            throw new RuntimeException("El nombre es obligatorio");
        }

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso.");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("El correo electrónico ya está registrado.");
        }
        if (userRepository.existsByRut(user.getRut())) {
            throw new RuntimeException("El RUT ya está registrado.");
        }
    }

    private void validateUpdatePermissions(User user, User administrator) {
        if (administrator.getId().equals(user.getId())) {
            return;
        }

        if (!isAdmin(administrator)) {
            throw new RuntimeException("No tienes permiso para editar el perfil de otros usuarios.");
        }

        if (!isSuperAdmin(administrator)) {
            if (isAdmin(user)) {
                throw new RuntimeException("Acceso denegado: No puedes editar a usuarios con privilegios administrativos.");
            }
        }
    }

    public boolean isAdmin(User user) {
        return "ADMIN".equals(user.getRole()) || "SUPERADMIN".equals(user.getRole());
    }

    public boolean isSuperAdmin(User user) {
        return "SUPERADMIN".equals(user.getRole());
    }
    
}