package com.toolrent.loans.Service;

import com.toolrent.loans.Entity.Loan;
import com.toolrent.loans.Model.LoanFull;
import com.toolrent.loans.Model.User;
import com.toolrent.loans.Repository.LoanRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.sql.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanService {

    @Autowired
    LoanRepository loanRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.users.url}")
    private String userServiceUrl;

    @Value("${microservices.clients.url}")
    private String clientsServiceUrl;

    public Loan saveLoan(Loan loan) {
        return loanRepository.save(loan);
    }

    @Transactional
    public Loan createLoan(Long userId, Long employeeId, Date initDate, Date returnDate) {

        validateAdminOrEmployee(employeeId);

        try {
            String urlValidate = clientsServiceUrl + "/validate/" + userId;
            Boolean canLoan = restTemplate.getForObject(urlValidate, Boolean.class);
            if (Boolean.FALSE.equals(canLoan)) {
                throw new RuntimeException("El cliente no cumple las condiciones (Tope de préstamos o Restringido).");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error validando estado del cliente: " + e.getMessage());
        }

        validateDates(initDate, returnDate);

        try {
            restTemplate.put(clientsServiceUrl + "/loans/increment/" + userId, null);
        } catch (Exception e) {
            System.err.println("Error incrementando loans del cliente: " + e.getMessage());
        }

        Loan loan = new Loan();
        loan.setUserId(userId);
        loan.setInitDate(initDate);
        loan.setReturnDate(returnDate);
        loan.setStatus("ACTIVO");

        return loanRepository.save(loan);
    }

    public Loan getLoanById(Long id) {
        return loanRepository.findById(id).orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
    }

    public LoanFull getLoanFullById(Long id) {
        Loan loan = getLoanById(id);
        return mapToLoanFull(loan);
    }

    public List<LoanFull> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(this::mapToLoanFull)
                .collect(Collectors.toList());
    }

    public List<LoanFull> getAllLoansByUserId(Long userId) {
        return loanRepository.findByUserId(userId).stream()
                .map(this::mapToLoanFull)
                .collect(Collectors.toList());
    }

    public List<LoanFull> filterLoans(String state, Long userId) {

        List<Loan> loans;
        Date actualDate = new Date(System.currentTimeMillis());

        if ((state == null || state.isBlank()) && userId != null) {
            loans = loanRepository.findByUserId(userId);
        }
        else if ((state != null && !state.isBlank()) && userId == null) {
            if (state.equals("ATRASADO")) {
                loans = loanRepository.findByReturnDateBeforeAndStatusNot(actualDate, "FINALIZADO");
            } else {
                loans = loanRepository.findByStatus(state);
            }
        }
        else if ((state != null && !state.isBlank()) && userId != null) {
            if (state.equals("ATRASADO")) {
                loans = loanRepository.findByUserIdAndReturnDateBeforeAndStatusNot(userId, actualDate, "FINALIZADO");
            } else {
                loans = loanRepository.findByUserIdAndStatus(userId, state);
            }
        }
        else {
            loans = loanRepository.findAll();
        }

        return loans.stream()
                .map(this::mapToLoanFull)
                .collect(Collectors.toList());
    }

    public boolean deleteLoan(Long loanId) {
        try {
            Loan loan = getLoanById(loanId);

            try {
                restTemplate.put(clientsServiceUrl + "/loans/decrement/" + loan.getUserId(), null);
            } catch (Exception e) {
                System.err.println("Error decrementando loans: " + e.getMessage());
            }

            loanRepository.deleteById(loanId);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    // Métodos auxiliares

    public void validateAdminOrEmployee(Long userId) {
        User user = getUserById(userId);
        if (user == null || (!"ADMIN".equals(user.getRole()) && !"EMPLOYEE".equals(user.getRole()) && !"SUPERADMIN".equals(user.getRole()))) {
            throw new RuntimeException("El usuario no tiene permisos para realizar esta acción.");
        }
    }

    public User getUserById(Long id) {
        try {
            return restTemplate.getForObject(userServiceUrl + "/id/" + id, User.class);
        } catch (Exception e) {
            return null;
        }
    }

    public void validateDates(Date initDate, Date returnDate) {
        if (initDate != null && returnDate != null) {
            java.time.LocalDate init = initDate.toLocalDate();
            java.time.LocalDate ret = returnDate.toLocalDate();
            if (!ret.isAfter(init)) {
                throw new RuntimeException("La fecha de devolución debe ser posterior a la inicial.");
            }
        }
    }

    private LoanFull mapToLoanFull(Loan loan) {
        User user = getUserById(loan.getUserId());
        return new LoanFull(
                loan.getId(),
                user,
                loan.getInitDate(),
                loan.getReturnDate(),
                loan.getRealReturnDate(),
                loan.getStatus()
        );
    }
}