package com.toolrent.inventory.Repository;

import com.toolrent.inventory.Entity.ToolStates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ToolStatesRepository extends JpaRepository<ToolStates, Long> {

    Optional<ToolStates> findByStateIgnoreCase(String state);

}