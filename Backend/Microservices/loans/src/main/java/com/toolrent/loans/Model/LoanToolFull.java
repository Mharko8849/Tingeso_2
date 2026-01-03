package com.toolrent.loans.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanToolFull {

    private Long id;
    private LoanFull loan;
    private ToolFull tool;
    private User employeeDel;
    private User employeeRec;
    private String toolActivity;
    private int debt;
    private int fine;
    private Boolean needRepair;
}