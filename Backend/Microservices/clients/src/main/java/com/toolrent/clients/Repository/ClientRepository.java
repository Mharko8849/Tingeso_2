package com.toolrent.clients.Repository;

import com.toolrent.clients.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    Client findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<Client> findByStateClient(String state);
}
