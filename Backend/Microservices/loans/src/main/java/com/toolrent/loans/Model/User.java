package com.toolrent.loans.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class User {
    private Long id;
    private String username;
    private String name;
    private String lastName;
    private String rut;
    private String email;
    private String role;
}
