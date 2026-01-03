package com.toolrent.inventory.Repository;

import com.toolrent.inventory.Entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByToolIdAndToolStateId(Long toolId, Long toolStateId);

}