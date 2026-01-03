package com.toolrent.inventory.Service;

import com.toolrent.inventory.Entity.ToolStates;
import com.toolrent.inventory.Model.User;
import com.toolrent.inventory.Repository.ToolStatesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class ToolStatesService {

    @Autowired
    ToolStatesRepository toolStatesRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.users.url}")
    private String usersServiceUrl;

    public List<ToolStates> getAllStates() {
        return toolStatesRepository.findAll();
    }

    public ToolStates getStateById(Long id) {
        return toolStatesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estado no encontrado"));
    }

    public ToolStates saveState(ToolStates state, Long userId) {

        validateAdmin(userId);

        if (state.getState() == null || state.getState().isBlank()) {
            throw new RuntimeException("El nombre del estado no puede estar vacío");
        }

        if (toolStatesRepository.findByStateIgnoreCase(state.getState()).isPresent()) {
            throw new RuntimeException("El estado '" + state.getState() + "' ya existe");
        }

        state.setState(state.getState().toUpperCase());

        return toolStatesRepository.save(state);
    }

    private void validateAdmin(Long userId) {
        if (userId == null) {
            throw new RuntimeException("Usuario no identificado.");
        }
        try {
            String url = usersServiceUrl + "/id/" + userId;
            User user = restTemplate.getForObject(url, User.class);
            if (user == null || (!"ADMIN".equals(user.getRole()) && !"SUPERADMIN".equals(user.getRole()))) {
                throw new RuntimeException("El usuario no tiene permisos de Administrador.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error validando permisos: " + e.getMessage());
        }
    }
}