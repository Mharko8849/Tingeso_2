package com.toolrent.kardex.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class KardexFull {
    private Long id;
    private Tool tool;
    private String type;
    private Date date;
    private int cant;
    private Integer cost;
    private User client;
    private User employee;
}
