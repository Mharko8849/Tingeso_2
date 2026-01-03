package com.toolrent.inventory.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name="tools")
@NoArgsConstructor
@AllArgsConstructor

public class Tool {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(unique = true, nullable = false)
    private Long id;

    private String toolName;

    @Column(name="category_id", nullable = false)
    private Long categoryId;
}
