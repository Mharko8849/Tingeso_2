package com.toolrent.loans.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@Entity
@Table(name="loans")
@NoArgsConstructor
@AllArgsConstructor

public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(unique = true, nullable = false)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    private Date initDate;

    private Date returnDate;

    private Date realReturnDate;

    private String status;
}
