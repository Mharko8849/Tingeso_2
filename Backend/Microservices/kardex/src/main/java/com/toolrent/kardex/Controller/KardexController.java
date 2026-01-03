package com.toolrent.kardex.Controller;

import com.toolrent.kardex.Entity.Kardex;
import com.toolrent.kardex.Model.KardexFull;
import com.toolrent.kardex.Service.KardexService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/kardex")
public class KardexController {

    @Autowired
    KardexService kardexService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<KardexFull>> getAllKardex() {
        List<KardexFull> kardex = kardexService.getAllKardex();
        return ResponseEntity.ok(kardex);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<KardexFull> getKardexById(@PathVariable Long id) {
        KardexFull kardex = kardexService.getKardexById(id);
        if (kardex == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(kardex);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Kardex> saveKardex(@RequestBody Kardex kardex) {
        Kardex newKardex = kardexService.saveKardex(kardex);
        return ResponseEntity.ok(newKardex);
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<Kardex> createKardex(
            @RequestParam Long toolId,
            @RequestParam String type,
            @RequestParam Date actualDate,
            @RequestParam int cant,
            @RequestParam(required = false) Integer cost,
            @RequestParam(required = false) Long userId,
            @RequestParam Long employeeId
    ) {
        Kardex newKardex = kardexService.createKardex(toolId, type, actualDate, cant, cost, userId, employeeId);
        return ResponseEntity.ok(newKardex);
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE', 'SUPERADMIN')")
    public ResponseEntity<List<KardexFull>> filterKardex(
            @RequestParam(required = false) Long idTool,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Date initDate,
            @RequestParam(required = false) Date finalDate,
            @RequestParam(required = false) Long idUser,
            @RequestParam(required = false) Long idEmployee
    ) {
        List<KardexFull> filteredList = kardexService.filterKardex(idTool, type, initDate, finalDate, idUser, idEmployee);
        return ResponseEntity.ok(filteredList);
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<Map<String, Object>>> getRankingTools(
            @RequestParam(required = false) Date initDate,
            @RequestParam(required = false) Date finalDate
    ) {
        if (initDate != null && finalDate != null) {
            return ResponseEntity.ok(kardexService.getRankingToolsByDateRange(initDate, finalDate));
        }
        return ResponseEntity.ok(kardexService.getRankingTools());
    }
}
