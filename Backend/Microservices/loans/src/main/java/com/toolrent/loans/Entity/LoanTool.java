package com.toolrent.loans.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@Entity
@Table(name="loan_tool")
@NoArgsConstructor
@AllArgsConstructor

public class LoanTool {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(unique = true, nullable = false)
    private Long id;

    @Column(name="loan_id", nullable = false)
    private Long loanId;

    @Column(name="tool_id", nullable = false)
    private Long toolId;

    @Column(name="employee_del_id")
    private Long employeeDelId;

    @Column(name="employee_rec_id")
    private Long employeeRecId;

    private String toolActivity;

    private int debt;

    private int fine;

    private Boolean needRepair;
}
