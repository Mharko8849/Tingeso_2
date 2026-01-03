package com.toolrent.users.Repository;

import com.toolrent.users.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
    User findByEmail(String email);

    User findByKeycloakId(String keycloakId);

    User findByUsernameIgnoreCase(String username);

    List<User> findByRole(String rol);

    boolean existsByRut(String rut);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
