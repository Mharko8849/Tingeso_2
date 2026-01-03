package com.toolrent.inventory.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name="inventory")
@NoArgsConstructor
@AllArgsConstructor

public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(unique = true, nullable = false)
    private Long id;

    @Column(name="tool_id", nullable = false)
    private Long toolId;

    @Column(name="toolState_id",nullable = false)
    private Long toolStateId;

    private int stockTool;
}
