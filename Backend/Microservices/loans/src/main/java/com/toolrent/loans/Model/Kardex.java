package com.toolrent.loans.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Kardex {
    private Long toolId;
    private String type;
    private Date date;
    private int cant;
    private Integer cost;
    private Long userId;
    private Long employeeId;
}