package com.toolrent.loans.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Amounts {
    private int repoCost;
    private int priceRent;
    private int priceFineAtDate;
}
