package com.toolrent.reports.Controller;

import com.toolrent.reports.Entity.Report;
import com.toolrent.reports.Service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Report> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @PostMapping("/generate/ranking")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Report> generateRankingReport(
            @RequestParam(required = false) Date initDate,
            @RequestParam(required = false) Date finalDate) {
        return ResponseEntity.ok(reportService.generateRankingReport(initDate, finalDate));
    }

    @PostMapping("/generate/active-loans")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Report> generateActiveLoansReport() {
        return ResponseEntity.ok(reportService.generateActiveLoansReport());
    }

    @PostMapping("/generate/delayed")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Report> generateDelayedClientsReport() {
        return ResponseEntity.ok(reportService.generateDelayedClientsReport());
    }

    @PostMapping("/generate/employees")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<Report> generateEmployeesReport() {
        return ResponseEntity.ok(reportService.generateEmployeesReport());
    }

    @PostMapping("/generate/clients")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN', 'EMPLOYEE')")
    public ResponseEntity<Report> generateClientsReport() {
        return ResponseEntity.ok(reportService.generateClientsReport());
    }

    @PostMapping("/generate/kardex")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN', 'EMPLOYEE')")
    public ResponseEntity<Report> generateKardexReport(
            @RequestParam(required = false) Date initDate,
            @RequestParam(required = false) Date finalDate) {
        return ResponseEntity.ok(reportService.generateKardexReport(initDate, finalDate));
    }
}
