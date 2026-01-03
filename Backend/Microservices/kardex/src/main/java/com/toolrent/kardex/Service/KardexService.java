package com.toolrent.kardex.Service;

import com.toolrent.kardex.Entity.Kardex;
import com.toolrent.kardex.Model.KardexFull;
import com.toolrent.kardex.Model.Tool;
import com.toolrent.kardex.Model.User;
import com.toolrent.kardex.Repository.KardexRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.sql.Date;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KardexService {

    @Autowired
    KardexRepository kardexRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.inventory.tools-url}")
    private String inventoryToolsUrl;

    @Value("${microservices.users.url}")
    private String userServiceUrl;

    public Kardex saveKardex(Kardex Kardex) {
        return kardexRepository.save(Kardex);
    }

    public Kardex createKardex(Long toolId, String type, Date actualDate, int cant, Integer cost, Long userId, Long employeeId) {
        Kardex kardex = new Kardex();

        if (cost != null) {
            kardex.setCost(cost);
        }

        if (toolId == null) {
            throw new RuntimeException("Herramienta no encontrada");
        }
        kardex.setToolId(toolId);

        if (type == null || type.isBlank()) {
            throw new RuntimeException("Debe especificar el motivo del movimiento");
        }
        kardex.setType(type);

        if (actualDate == null) {
            throw new RuntimeException("Debe contar con una fecha de movimiento");
        }
        kardex.setDate(actualDate);

        kardex.setCant(cant);

        kardex.setUserId(userId);

        if (employeeId == null) {
            throw new RuntimeException("Usuario no encontrado");
        }
        kardex.setEmployeeId(employeeId);

        return kardexRepository.save(kardex);
    }

    // Métodos con KardexFull para lectura del frontend

    public List<KardexFull> getAllKardex() {
        List<Kardex> kardexList = kardexRepository.findAll();
        return kardexList.stream()
                .map(this::mapToKardexFull)
                .collect(Collectors.toList());
    }

    public KardexFull getKardexById(Long id) {
        Kardex kardex = kardexRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento de kardex no encontrado"));

        return mapToKardexFull(kardex);
    }

    public List<KardexFull> getKardexByDateBetween(Date initDate, Date finalDate) {
        if (initDate == null) {
            throw new RuntimeException("No se ha proporcionado una fecha de movimiento inicial");
        }
        if (finalDate == null) {
            throw new RuntimeException("No se ha proporcionado una fecha de movimiento final");
        }

        List<Kardex> kardexList = kardexRepository.findByDateBetween(initDate, finalDate);

        return kardexList.stream()
                .map(this::mapToKardexFull)
                .collect(Collectors.toList());
    }

    public List<KardexFull> filterKardex(Long idTool, String type, Date initDate, Date finalDate, Long idUser, Long idEmployee) {
        List<Kardex> kardexList = kardexRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));

        if (type != null && !type.isBlank()) {
            kardexList = kardexList.stream()
                    .filter(kardex -> kardex.getType() != null && kardex.getType().equalsIgnoreCase(type))
                    .toList();
        }

        if (idTool != null) {
            kardexList = kardexList.stream()
                    .filter(kardex -> kardex.getToolId() != null && kardex.getToolId().equals(idTool))
                    .toList();
        }

        if (idUser != null) {
            kardexList = kardexList.stream()
                    .filter(kardex -> kardex.getUserId() != null && kardex.getUserId().equals(idUser))
                    .toList();
        }

        if (idEmployee != null) {
            kardexList = kardexList.stream()
                    .filter(kardex -> kardex.getEmployeeId() != null && kardex.getEmployeeId().equals(idEmployee))
                    .toList();
        }

        if (initDate != null) {
            kardexList = kardexList.stream()
                    .filter(kardex -> kardex.getDate().after(initDate))
                    .toList();
        }

        if (finalDate != null) {
            kardexList = kardexList.stream()
                    .filter(kardex -> kardex.getDate().before(finalDate))
                    .toList();
        }

        return kardexList.stream()
                .map(this::mapToKardexFull)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRankingToolsByDateRange(Date initDate, Date finalDate) {
        if (initDate == null || finalDate == null) {
            return getRankingTools();
        }

        List<Kardex> kardexList = kardexRepository.findByDateBetween(initDate, finalDate);

        Map<Long, Integer> toolCountMap = kardexList.stream()
                .filter(k -> k.getType() != null && "PRESTAMO".equalsIgnoreCase(k.getType()))
                .collect(Collectors.groupingBy(
                        Kardex::getToolId,
                        Collectors.summingInt(Kardex::getCant)
                ));

        return generateReport(toolCountMap);
    }

    public List<Map<String, Object>> getRankingTools() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.DAY_OF_MONTH, 1);
        Date initDate = new Date(calendar.getTimeInMillis());

        calendar.set(Calendar.DAY_OF_MONTH, calendar.getActualMaximum(Calendar.DAY_OF_MONTH));
        Date finalDate = new Date(calendar.getTimeInMillis());

        List<Kardex> kardexList = kardexRepository.findByDateBetween(initDate, finalDate);

        Map<Long, Integer> toolCountMap = kardexList.stream()
                .filter(k -> k.getType() != null && "PRESTAMO".equalsIgnoreCase(k.getType()))
                .collect(Collectors.groupingBy(
                        Kardex::getToolId,
                        Collectors.summingInt(Kardex::getCant)
                ));

        return generateReport(toolCountMap);
    }

    private List<Map<String, Object>> generateReport(Map<Long, Integer> toolCountMap) {

        Tool[] toolsArray = restTemplate.getForObject(inventoryToolsUrl, Tool[].class);

        List<Tool> allTools = toolsArray != null ? Arrays.asList(toolsArray) : new ArrayList<>();
        List<Map<String, Object>> fullList = new ArrayList<>();

        int i = 0;
        while (i < allTools.size()) {
            Tool tool = allTools.get(i);
            Integer count = toolCountMap.getOrDefault(tool.getId(), 0);

            Map<String, Object> map = new HashMap<>();
            map.put("tool", tool);
            map.put("totalLoans", count);
            fullList.add(map);
            i+=1;
        }

        fullList.sort((a, b) -> ((Integer) b.get("totalLoans")).compareTo((Integer) a.get("totalLoans")));

        List<Map<String, Object>> result = new ArrayList<>();
        i = 0;
        while (i < fullList.size() && i < 10) {
            result.add(fullList.get(i));
            i+=1;
        }

        return result;
    }

    private KardexFull mapToKardexFull(Kardex kardex) {
        Tool tool = null;
        User clientUser = null;
        User employeeUser = null;

        // 1. Obtener Herramienta
        try {
            // Asumo que tu inventory service responde en /id/{id} o /{id}
            String url_tool = inventoryToolsUrl + "/id/" + kardex.getToolId();
            tool = restTemplate.getForObject(url_tool, Tool.class);
        } catch (Exception e) {
            System.err.println("Error conectando con Inventory-Service: " + e.getMessage());
        }

        if (kardex.getUserId() != null){
            try {
                String url_client = userServiceUrl + "/id/" + kardex.getUserId();
                clientUser = restTemplate.getForObject(url_client, User.class);
            } catch (Exception e) {
                System.err.println("Error conectando con Users-Service (Cliente): " + e.getMessage());
            }
        }

        try {
            String url_employee = userServiceUrl + "/id/" + kardex.getEmployeeId();
            employeeUser = restTemplate.getForObject(url_employee, User.class);
        } catch (Exception e) {
            System.err.println("Error conectando con Users-Service (Empleado): " + e.getMessage());
        }

        return new KardexFull(
                kardex.getId(),
                tool,
                kardex.getType(),
                kardex.getDate(),
                kardex.getCant(),
                kardex.getCost(),
                clientUser,
                employeeUser
        );
    }
}