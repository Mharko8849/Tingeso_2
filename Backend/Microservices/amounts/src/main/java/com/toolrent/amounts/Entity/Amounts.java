package com.toolrent.amounts.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name="amounts")
@NoArgsConstructor
@AllArgsConstructor

public class Amounts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(unique = true, nullable = false)
    private Long id;

    @Column(name="tool_id", unique = true, nullable = false)
    private Long toolId;

    @Column(nullable = false)
    private int repoCost;

    @Column(nullable = false)
    private int priceRent;

    @Column(nullable = false)
    private int priceFineAtDate;
}
