package com.toolrent.loans.Service;

import com.toolrent.loans.Entity.Loan;
import com.toolrent.loans.Entity.LoanTool;
import com.toolrent.loans.Model.*;
import com.toolrent.loans.Repository.LoanToolRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.sql.Date;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LoanToolService {

    @Autowired
    LoanToolRepository loanToolRepository;

    @Autowired
    LoanService loanService;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.inventory.url}")
    private String inventoryServiceUrl;

    @Value("${microservices.inventory.tools-url}")
    private String inventoryToolsServiceUrl;

    @Value("${microservices.kardex.url}")
    private String kardexServiceUrl;

    @Value("${microservices.clients.url}")
    private String clientsServiceUrl;

    public List<LoanToolFull> getAllLoanTools() {
        return loanToolRepository.findAll().stream()
                .map(this::mapToLoanToolFull)
                .collect(Collectors.toList());
    }

    public List<LoanToolFull> getByLoanId(Long loanId) {
        return loanToolRepository.findByLoanId(loanId).stream()
                .map(this::mapToLoanToolFull)
                .collect(Collectors.toList());
    }

    public List<LoanToolFull> getByUserId(Long userId) {
        List<LoanFull> userLoans = loanService.getAllLoansByUserId(userId);
        List<LoanToolFull> result = new ArrayList<>();

        int i = 0;
        while(i < userLoans.size()) {
            List<LoanToolFull> tools = getByLoanId(userLoans.get(i).getId());
            result.addAll(tools);
            i+=1;
        }
        return result;
    }

    @Transactional
    public LoanTool createLoanTool(Long loanId, Long toolId) {
        Loan loan = loanService.getLoanById(loanId);

        try {
            String url_validate_client = clientsServiceUrl + "/validate/" + loan.getUserId();
            Boolean canLoan = restTemplate.getForObject(url_validate_client, Boolean.class);

            if (Boolean.FALSE.equals(canLoan)) {
                throw new RuntimeException("El cliente no puede solicitar más herramientas.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error validando cliente: " + e.getMessage());
        }

        loanService.validateDates(loan.getInitDate(), loan.getReturnDate());

        if (!checkToolAvailability(toolId)) {
            throw new RuntimeException("La herramienta solicitada no se encuentra disponible.");
        }

        if (isToolLoanedToUser(toolId, loan.getUserId())) {
            throw new RuntimeException("El usuario ya cuenta con un préstamo activo de esta herramienta.");
        }

        ToolFull tool = getToolById(toolId);
        int priceRent = (tool.getAmounts() != null) ? tool.getAmounts().getPriceRent() : 0;

        LoanTool lt = new LoanTool();
        lt.setLoanId(loanId);
        lt.setToolId(toolId);
        lt.setDebt(priceRent);
        lt.setFine(0);
        lt.setNeedRepair(false);

        return loanToolRepository.save(lt);
    }

    @Transactional
    public LoanTool giveLoanTool(Long employeeId, Long loanToolId) {
        loanService.validateAdminOrEmployee(employeeId);

        LoanTool loanTool = loanToolRepository.findById(loanToolId)
                .orElseThrow(() -> new RuntimeException("Relación no encontrada"));

        Loan loan = loanService.getLoanById(loanTool.getLoanId());

        if (!"ACTIVO".equals(loan.getStatus())) {
            throw new RuntimeException("El pedido ya no está activo.");
        }
        if (loanTool.getToolActivity() != null && !loanTool.getToolActivity().isBlank()) {
            throw new RuntimeException("El pedido ya cuenta con actividades previas.");
        }

        try {
            String url_inventory_loan = inventoryServiceUrl + "/loan/" + loanTool.getToolId();
            restTemplate.postForObject(url_inventory_loan, null, Void.class);
        } catch (Exception e) {
            throw new RuntimeException("Error en Inventory: " + e.getMessage());
        }

        Date actualDate = new Date(System.currentTimeMillis());
        loanTool.setToolActivity("PRESTADA");
        loanTool.setEmployeeDelId(employeeId);

        createKardexEntry(loanTool.getToolId(), "PRESTAMO", 1, null, loan.getUserId(), employeeId);

        return loanToolRepository.save(loanTool);
    }

    @Transactional
    public List<LoanTool> giveAllLoanTools(Long employeeId, List<Long> ids) {
        List<LoanTool> results = new ArrayList<>();
        int i = 0;
        while (i < ids.size()) {
            results.add(giveLoanTool(employeeId, ids.get(i)));
            i+=1;
        }
        return results;
    }

    @Transactional
    public LoanTool receiveLoanTool(Long employeeId, Long loanToolId, String damageTool) {
        loanService.validateAdminOrEmployee(employeeId);

        LoanTool loanTool = loanToolRepository.findById(loanToolId)
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));
        Loan loan = loanService.getLoanById(loanTool.getLoanId());

        String typeKardex;
        String targetStateInventory;

        switch (damageTool) {
            case "SIN DAÑO" -> {
                targetStateInventory = "DISPONIBLE";
                typeKardex = "DEVOLUCION";
            }
            case "DAÑO" -> {
                loanTool.setNeedRepair(true);
                targetStateInventory = "EN REPARACION";
                typeKardex = "REPARACION";
            }
            case "IRREPARABLE" -> {
                targetStateInventory = "DADA DE BAJA";
                typeKardex = "BAJA";
            }
            default -> throw new RuntimeException("Tipo de daño inválido");
        }

        try {
            String url_inventory_return = inventoryServiceUrl + "/return/" + loanTool.getToolId() + "?targetState=" + targetStateInventory;
            restTemplate.postForObject(url_inventory_return, null, Void.class);
        } catch (Exception e) {
            throw new RuntimeException("Error devolviendo stock en Inventory: " + e.getMessage());
        }

        int fine = calculateFine(loanTool, damageTool);
        if (fine != 0) {
            loanTool.setFine(fine);
        }

        loanTool.setToolActivity("DEVUELTA");
        loanTool.setEmployeeRecId(employeeId);

        createKardexEntry(loanTool.getToolId(), typeKardex, 1, null, loan.getUserId(), employeeId);

        return loanToolRepository.save(loanTool);
    }

    @Transactional
    public List<LoanTool> receiveAllLoanTools(Long employeeId, Long loanId, Map<String, String> stateMap) {

        Map<Long, String> states = new HashMap<>();
        for (Map.Entry<String, String> entry : stateMap.entrySet()) {
            try {
                states.put(Long.parseLong(entry.getKey()), entry.getValue());
            } catch (NumberFormatException e) {
            }
        }

        Loan loan = loanService.getLoanById(loanId);
        List<LoanTool> lxtList = loanToolRepository.findByLoanId(loanId);
        List<LoanTool> results = new ArrayList<>();

        int totalFine = 0;
        boolean anyNeedRepair = false;

        int i = 0;
        while (i < lxtList.size()) {
            LoanTool lxt = lxtList.get(i);

            if (states.containsKey(lxt.getId())) {
                String state = states.get(lxt.getId());
                LoanTool updated = receiveLoanTool(employeeId, lxt.getId(), state);
                results.add(updated);

                totalFine += updated.getFine();
                if ("DAÑO".equals(state)) anyNeedRepair = true;
            }
            i+=1;
        }

        if (allToolsReturned(loanId)) {
            Date actualDate = new Date(System.currentTimeMillis());
            loan.setRealReturnDate(actualDate);

            String url_decrement_loans = clientsServiceUrl + "/loans/decrement/" + loan.getUserId();
            restTemplate.put(url_decrement_loans, null);

            boolean hasDebt = (totalFine > 0) || userHaveDebt(loan.getUserId());

            if (!hasDebt && !anyNeedRepair) {
                loan.setStatus("FINALIZADO");
                String url_client_state = clientsServiceUrl + "/state/" + loan.getUserId() + "?state=ACTIVO";
                restTemplate.put(url_client_state, null);
            } else {
                loan.setStatus("PENDIENTE");
                String url_client_state = clientsServiceUrl + "/state/" + loan.getUserId() + "?state=RESTRINGIDO";
                restTemplate.put(url_client_state, null);
            }
            loanService.saveLoan(loan);
        }

        return results;
    }

    @Transactional
    public boolean payDebt(Long loanId, Long adminId) {
        loanService.validateAdminOrEmployee(adminId);
        Loan loan = loanService.getLoanById(loanId);

        List<LoanTool> lxt = loanToolRepository.findByLoanId(loanId);

        boolean paidSomething = false;
        int i = 0;
        while(i < lxt.size()){
            LoanTool l = lxt.get(i);
            if (l.getFine() > 0) {
                createKardexEntry(l.getToolId(), "PAGO DEUDA", 1, l.getFine(), loan.getUserId(), adminId);
                l.setFine(0);
                loanToolRepository.save(l);
                paidSomething = true;
            }
            i+=1;
        }

        if (paidSomething) {
            if (!userHaveDebt(loan.getUserId()) && !needRepairToolByLoan(loanId)) {
                String url_client_state = clientsServiceUrl + "/state/" + loan.getUserId() + "?state=ACTIVO";
                restTemplate.put(url_client_state, null);
            }

            if (!needRepairToolByLoan(loanId)) {
                loan.setStatus("FINALIZADO");
                loanService.saveLoan(loan);
            }
            return true;
        }
        return false;
    }

    @Transactional
    public boolean payRepairTool(Long loanId, Long adminId, int cost) {
        loanService.validateAdminOrEmployee(adminId);
        Loan loan = loanService.getLoanById(loanId);

        List<LoanTool> lxtList = loanToolRepository.findByLoanId(loanId);

        boolean hadRepairPending = false;

        int i = 0;
        while (i < lxtList.size()) {
            LoanTool lxt = lxtList.get(i);

            if (Boolean.TRUE.equals(lxt.getNeedRepair())) {
                hadRepairPending = true;

                createKardexEntry(lxt.getToolId(), "PAGO REPARACION", 1, cost, loan.getUserId(), adminId);

                lxt.setNeedRepair(false);
                loanToolRepository.save(lxt);

                try {
                    String url_inventory_repair = inventoryServiceUrl + "/repair/" + lxt.getToolId();
                    restTemplate.postForObject(url_inventory_repair, null, Void.class);
                } catch (Exception e) {
                    System.err.println("Error en Inventory repair: " + e.getMessage());
                }
            }
            i++;
        }

        if (hadRepairPending) {
            if (!userHaveDebt(loan.getUserId())) {
                String url_client_state = clientsServiceUrl + "/state/" + loan.getUserId() + "?state=ACTIVO";
                restTemplate.put(url_client_state, null);
            }

            loan.setStatus("FINALIZADO");
            loanService.saveLoan(loan);

            return true;
        }

        return false;
    }

    public int getTotalDebt(Long loanId){
        List<LoanTool> lxt = loanToolRepository.findByLoanId(loanId);
        int totalDebt = 0;
        int i = 0;
        while(i < lxt.size()){
            totalDebt += lxt.get(i).getDebt();
            i+=1;
        }
        return totalDebt;
    }

    public int getTotalFine(Long loanId){
        List<LoanTool> lxt = loanToolRepository.findByLoanId(loanId);
        int totalFine = 0;
        int i = 0;
        while(i < lxt.size()){
            totalFine += lxt.get(i).getFine();
            i+=1;
        }
        return totalFine;
    }

    public int getFinePreview(Long loanToolId, String state) {
        LoanTool lxt = loanToolRepository.findById(loanToolId)
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));
        return calculateFine(lxt, state);
    }

    // Métodos auxiliares

    public int calculateFine(LoanTool lxt, String state) {
        ToolFull tool = getToolById(lxt.getToolId());
        if (tool.getAmounts() == null) return 0;

        Loan loan = loanService.getLoanById(lxt.getLoanId());

        int daysFine = 0;
        Date now = new Date(System.currentTimeMillis());
        if (now.after(loan.getReturnDate())) {
            long diff = ChronoUnit.DAYS.between(loan.getReturnDate().toLocalDate(),now.toLocalDate());
            daysFine = (int) diff * tool.getAmounts().getPriceFineAtDate();
        }

        int stateFine = 0;
        if ("IRREPARABLE".equals(state)) {
            stateFine = tool.getAmounts().getRepoCost();
        }
        return daysFine + stateFine;
    }

    private boolean checkToolAvailability(Long toolId) {
        try {
            String url = inventoryServiceUrl + "/check/" + toolId;
            return Boolean.TRUE.equals(restTemplate.getForObject(url, Boolean.class));
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isToolLoanedToUser(Long toolId, Long userId) {
        List<LoanFull> userLoans = loanService.getAllLoansByUserId(userId);
        int i = 0;
        while (i < userLoans.size()) {
            LoanFull l = userLoans.get(i);
            if (l.getRealReturnDate() == null) {
                List<LoanTool> tools = loanToolRepository.findByLoanIdAndToolId(l.getId(), toolId);
                long activeCount = tools.stream().filter(t -> !"DEVUELTA".equals(t.getToolActivity())).count();
                if (activeCount > 0) return true;
            }
            i+=1;
        }
        return false;
    }

    private boolean allToolsReturned(Long loanId) {
        List<LoanTool> list = loanToolRepository.findByLoanId(loanId);
        int i = 0;
        while(i < list.size()){
            String act = list.get(i).getToolActivity();
            if(act == null || !act.equals("DEVUELTA")){
                return false;
            }
            i+=1;
        }
        return true;
    }

    private boolean userHaveDebt(Long userId) {
        List<LoanToolFull> allTools = getByUserId(userId);
        return allTools.stream().anyMatch(t -> t.getFine() > 0);
    }

    private boolean needRepairToolByLoan(Long loanId) {
        List<LoanTool> tools = loanToolRepository.findByLoanId(loanId);
        return tools.stream().anyMatch(t -> Boolean.TRUE.equals(t.getNeedRepair()));
    }

    private void createKardexEntry(Long toolId, String type, int cant, Integer cost, Long userId, Long employeeId) {
        try {
            Kardex newKardex = new Kardex();
            newKardex.setToolId(toolId);
            newKardex.setType(type);
            newKardex.setCant(cant);
            newKardex.setEmployeeId(employeeId);
            newKardex.setDate(new Date(System.currentTimeMillis()));
            newKardex.setUserId(userId);
            newKardex.setCost(cost);

            HttpEntity<Kardex> request = new HttpEntity<>(newKardex);

            String url_create_kardex = kardexServiceUrl + "/create";
            restTemplate.postForObject(url_create_kardex, request, Void.class);
        } catch (Exception e) {
            System.err.println("Error creando Kardex: " + e.getMessage());
        }
    }

    private ToolFull getToolById(Long toolId) {
        try {
            String url_get_tool = inventoryToolsServiceUrl + "/" + toolId;
            return restTemplate.getForObject(url_get_tool, ToolFull.class);
        } catch (Exception e) {
            return new ToolFull();
        }
    }

    private LoanToolFull mapToLoanToolFull(LoanTool lt) {
        ToolFull tool = getToolById(lt.getToolId());
        LoanFull loanFull = loanService.getLoanFullById(lt.getLoanId());

        User empDel = lt.getEmployeeDelId() != null ? loanService.getUserById(lt.getEmployeeDelId()) : null;
        User empRec = lt.getEmployeeRecId() != null ? loanService.getUserById(lt.getEmployeeRecId()) : null;

        return new LoanToolFull(
                lt.getId(),
                loanFull,
                tool,
                empDel,
                empRec,
                lt.getToolActivity(),
                lt.getDebt(),
                lt.getFine(),
                lt.getNeedRepair()
        );
    }
}