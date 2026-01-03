package com.toolrent.loans.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanFull {
    private Long id;
    private User client; // El usuario cliente completo
    private Date initDate;
    private Date returnDate;
    private Date realReturnDate;
    private String status;
}