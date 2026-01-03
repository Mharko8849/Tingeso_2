package com.toolrent.inventory.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Amounts {
    private Long id;
    private Long toolId;
    private int repoCost;
    private int priceRent;
    private int priceFineAtDate;
}
