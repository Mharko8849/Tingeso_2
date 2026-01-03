package com.toolrent.amounts.Repository;

import com.toolrent.amounts.Entity.Amounts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmountsRepository extends JpaRepository<Amounts, Long> {

    Optional<Amounts> findByToolId(Long toolId);

    boolean existsByToolId(Long toolId);
}
