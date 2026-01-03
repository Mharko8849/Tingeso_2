package com.toolrent.amounts.Service;

import com.toolrent.amounts.Entity.Amounts;
import com.toolrent.amounts.Repository.AmountsRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AmountsService {

    @Autowired
    private AmountsRepository amountsRepository;

    public Amounts getAmountsByToolId(Long toolId){
        return amountsRepository.findByToolId(toolId).
                orElseThrow(null);
    }

    public void createAmounts(Long toolId, Amounts amounts) {
        // Vemos que no exista ya un registro para esta herramienta
        if (amountsRepository.existsByToolId(toolId)) {
            throw new RuntimeException("Ya existen precios definidos para la herramienta ID: " + toolId);
        }

        // Validaciones de negocio
        validateAmounts(amounts);

        amounts.setToolId(toolId);
        amountsRepository.save(amounts);
    }

    public void updateAmounts(Long toolId, Amounts actualAmounts) {

        Amounts amounts = getAmountsByToolId(toolId);

        validateAmounts(actualAmounts);

        amounts.setPriceRent(actualAmounts.getPriceRent());
        amounts.setRepoCost(actualAmounts.getRepoCost());
        amounts.setPriceFineAtDate(actualAmounts.getPriceFineAtDate());
        amountsRepository.save(amounts);
    }

    // Método auxiliar
    private void validateAmounts(Amounts amounts) {
        List<String> errors = new ArrayList<>();

        if (amounts.getRepoCost() <= 0) {
            errors.add("Debe ingresar un costo de reposición mayor a 0.");
        }
        if (amounts.getPriceRent() <= 0) {
            errors.add("Debe ingresar un precio de renta mayor a 0.");
        }
        if (amounts.getPriceFineAtDate() <= 0) {
            errors.add("Debe ingresar un precio de multa mayor a 0.");
        }

        if (!errors.isEmpty()) {
            throw new RuntimeException(String.join(" ", errors));
        }
    }
}