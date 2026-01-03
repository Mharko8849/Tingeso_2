package com.toolrent.inventory.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Kardex {
    private Long toolId;
    private String type;
    private Date actualDate;
    private int cant;
    private Integer cost;
    private Long userId;
    private Long employeeId;
}