package com.toolrent.kardex.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@Entity
@Table(name="kardex")
@NoArgsConstructor
@AllArgsConstructor

public class Kardex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(unique = true, nullable = false)
    private Long id;

    @Column(name = "tool_id", nullable = false)
    private Long toolId;

    private String type;

    private Date date;

    private int cant;

    private Integer cost;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "employee_id")
    private Long employeeId;

}
