package com.toolrent.kardex.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Tool {
    private Long id;
    private String toolName;
    private String categoryName;
    private Amounts amounts;
    private String imageUrl;

    // Getters for compatibility if needed, or just use public fields/lombok
    public String getName() {
        return toolName;
    }
}
