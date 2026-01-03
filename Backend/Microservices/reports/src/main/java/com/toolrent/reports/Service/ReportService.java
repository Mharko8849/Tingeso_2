package com.toolrent.reports.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toolrent.reports.Entity.Report;
import com.toolrent.reports.Repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.sql.Date;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    ReportRepository reportRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.loans.url}")
    private String loansServiceUrl;

    @Value("${microservices.kardex.url}")
    private String kardexServiceUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public Report getReportById(Long id) {
        return reportRepository.findById(id).orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
    }

    public Report generateRankingReport(Date initDate, Date finalDate) {
        try {
            String url = kardexServiceUrl + "/ranking";
            if (initDate != null && finalDate != null) {
                url += "?initDate=" + initDate + "&finalDate=" + finalDate;
            }
            
            Object rankingData = restTemplate.getForObject(url, Object.class);
            String jsonData = objectMapper.writeValueAsString(rankingData);

            Report report = new Report();
            report.setReportName("Ranking de Herramientas");
            report.setGeneratedDate(new Date(System.currentTimeMillis()));
            report.setType("RANKING");
            report.setData(jsonData);

            return reportRepository.save(report);
        } catch (Exception e) {
            throw new RuntimeException("Error generando reporte de ranking: " + e.getMessage());
        }
    }

    public Report generateActiveLoansReport() {
        try {
            String url = loansServiceUrl + "/filter?state=ACTIVO";
            Object loansData = restTemplate.getForObject(url, Object.class);
            String jsonData = objectMapper.writeValueAsString(loansData);

            Report report = new Report();
            report.setReportName("Reporte de Préstamos Activos");
            report.setGeneratedDate(new Date(System.currentTimeMillis()));
            report.setType("PRESTAMOS ACTIVOS");
            report.setData(jsonData);

            return reportRepository.save(report);
        } catch (Exception e) {
            throw new RuntimeException("Error generando reporte de préstamos activos: " + e.getMessage());
        }
    }

    public Report generateDelayedClientsReport() {
        try {
            // Primero obtenemos los préstamos atrasados
            String url = loansServiceUrl + "/filter?state=ATRASADO";
            Object loansData = restTemplate.getForObject(url, Object.class);
            
            // Aquí podríamos procesar más la data si quisiéramos agrupar por cliente,
            // pero por ahora guardamos el snapshot de los préstamos atrasados que es lo que pide el RF.
            // "Listar clientes con atrasos" -> Si guardamos la lista de préstamos atrasados, 
            // implícitamente tenemos los clientes y sus deudas.
            
            String jsonData = objectMapper.writeValueAsString(loansData);

            Report report = new Report();
            report.setReportName("Reporte de Clientes con Atrasos");
            report.setGeneratedDate(new Date(System.currentTimeMillis()));
            report.setType("CLIENTES ATRASADOS");
            report.setData(jsonData);

            return reportRepository.save(report);
        } catch (Exception e) {
            throw new RuntimeException("Error generando reporte de clientes con atrasos: " + e.getMessage());
        }
    }
}
