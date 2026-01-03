package com.toolrent.loans.Repository;

import com.toolrent.loans.Entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserId(Long userId);

    List<Loan> findByStatus(String status);

    List<Loan> findByUserIdAndStatus(Long userId, String status);

    List<Loan> findByReturnDateBeforeAndStatusNot(Date date, String status);

    List<Loan> findByUserIdAndReturnDateBeforeAndStatusNot(Long userId, Date date, String status);
}