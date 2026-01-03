package com.toolrent.inventory.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class InventoryFull {
    private Long id;
    private ToolFull toolFull;
    private String toolStateName;
    private int stockTool;
}
