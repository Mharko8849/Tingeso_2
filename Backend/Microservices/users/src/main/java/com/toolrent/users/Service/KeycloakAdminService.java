package com.toolrent.users.Service;

import com.toolrent.users.Entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url}")
    private String keycloakUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    @Autowired
    @Qualifier("externalRestTemplate")
    private RestTemplate restTemplate;

    // Obtener Token de Administrador
    private String obtainAdminAccessToken() {
        String url = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);

        try {
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return response.getBody().get("access_token").toString();
        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo token de admin Keycloak", e);
        }
    }

    public String createKeycloakUser(User user, String roleName) {
        String token = obtainAdminAccessToken();
        String url = keycloakUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getEmail());
        userMap.put("firstName", user.getName());
        userMap.put("lastName", user.getLastName());
        userMap.put("enabled", true);
        userMap.put("emailVerified", true);

        Map<String, Object> creds = new HashMap<>();
        creds.put("type", "password");
        creds.put("value", user.getPassword());
        creds.put("temporary", false);
        userMap.put("credentials", Collections.singletonList(creds));

        ResponseEntity<Void> response = restTemplate.postForEntity(url, new HttpEntity<>(userMap, headers), Void.class);

        if (response.getStatusCode() != HttpStatus.CREATED) {
            throw new RuntimeException("Keycloak respondió con estado: " + response.getStatusCode());
        }

        String userId;
        try {
            String location = response.getHeaders().getLocation().getPath();
            userId = location.substring(location.lastIndexOf('/') + 1);
        } catch (Exception e) {
            userId = searchUserIdByUsername(user.getUsername(), headers);
        }

        assignRoleToUser(userId, roleName, headers);

        return userId;
    }

    // Actualizar datos básicos en Keycloak
    public void updateKeycloakUser(String keycloakId, User user) {
        String token = obtainAdminAccessToken();
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getEmail());
        userMap.put("firstName", user.getName());
        userMap.put("lastName", user.getLastName());

        try {
            restTemplate.put(url, new HttpEntity<>(userMap, headers));
        } catch (Exception e) {
            throw new RuntimeException("Error actualizando usuario en Keycloak: " + e.getMessage());
        }
    }

    // Actualizar contraseña en Keycloak
    public void resetPassword(String keycloakId, String newPassword) {
        String token = obtainAdminAccessToken();
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId + "/reset-password";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> creds = new HashMap<>();
        creds.put("type", "password");
        creds.put("value", newPassword);
        creds.put("temporary", false);

        try {
            restTemplate.put(url, new HttpEntity<>(creds, headers));
        } catch (Exception e) {
            throw new RuntimeException("Error actualizando contraseña en Keycloak: " + e.getMessage());
        }
    }

    public void deleteKeycloakUser(String userId) {
        String token = obtainAdminAccessToken();
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
        } catch (Exception e) {
            System.err.println("Error eliminando usuario Keycloak: " + e.getMessage());
        }
    }

    public Map<String, Object> requestPasswordGrant(String username, String password) {
        String url = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "password");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("username", username);
        map.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        return response.getBody();
    }

    private String searchUserIdByUsername(String username, HttpHeaders headers) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/users?username=" + username;
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class);

        List<Map<String, Object>> users = response.getBody();
        if (users == null || users.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado después de creación");
        }
        for (Map<String, Object> u : users) {
            if (username.equalsIgnoreCase((String) u.get("username"))) {
                return (String) u.get("id");
            }
        }
        throw new RuntimeException("Usuario exacto no encontrado");
    }

    private void assignRoleToUser(String userId, String roleName, HttpHeaders headers) {
        if (roleName == null) roleName = "CLIENT";

        String roleUrl = keycloakUrl + "/admin/realms/" + realm + "/roles/" + roleName;
        ResponseEntity<Map> roleResponse;
        try {
            roleResponse = restTemplate.exchange(roleUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        } catch (Exception e) {
            throw new RuntimeException("El rol '" + roleName + "' no existe en Keycloak");
        }

        String mappingUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
        List<Map> body = Collections.singletonList(roleResponse.getBody());

        restTemplate.postForEntity(mappingUrl, new HttpEntity<>(body, headers), Void.class);
    }
}