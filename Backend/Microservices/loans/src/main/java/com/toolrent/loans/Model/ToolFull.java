package com.toolrent.loans.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class ToolFull {
    private Long id;
    private String toolName;
    private String categoryName;
    private Amounts amounts;
}
