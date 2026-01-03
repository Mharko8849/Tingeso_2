package com.toolrent.loans.Repository;

import com.toolrent.loans.Entity.LoanTool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanToolRepository extends JpaRepository<LoanTool, Long> {

    List<LoanTool> findByLoanId(Long loanId);

    List<LoanTool> findByLoanIdAndToolId(Long loanId, Long toolId);
}