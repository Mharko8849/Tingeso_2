package com.toolrent.inventory.Model;

import com.toolrent.inventory.Entity.Tool;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class ToolInput {
    private Tool tool;
    private Amounts amounts;
}
