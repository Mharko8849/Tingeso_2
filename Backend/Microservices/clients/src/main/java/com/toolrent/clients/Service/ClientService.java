package com.toolrent.clients.Service;

import com.toolrent.clients.Entity.Client;
import com.toolrent.clients.Model.ClientFull;
import com.toolrent.clients.Model.User;
import com.toolrent.clients.Repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientService {

    @Autowired
    ClientRepository clientRepository;

    @Autowired
    RestTemplate restTemplate;

    @Value("${microservices.users.url}")
    private String userServiceUrl;

    public void createClient(Long userId) {

        if (clientRepository.existsByUserId(userId)) {
            return; // Si ya existe no hacemos nada
        }

        Client client = new Client();
        client.setUserId(userId);
        client.setLoans(0);
        client.setStateClient("ACTIVO");

        clientRepository.save(client);
    }

    public void incrementLoansCount(Long userId){
        Client client = clientRepository.findByUserId(userId);
        if (client == null){
            throw new RuntimeException("Cliente no encontrado");
        }
        client.setLoans(client.getLoans()+1);
        clientRepository.save(client);
    }

    public void decrementLoansCount(Long userId){
        Client client = clientRepository.findByUserId(userId);
        if (client == null){
            throw new RuntimeException("Cliente no encontrado");
        }
        client.setLoans(client.getLoans()-1);
        clientRepository.save(client);
    }


    public boolean canDoAnotherLoan(Long userId) {
        Client client = clientRepository.findByUserId(userId);
        if (client == null){
            throw new RuntimeException("Cliente no encontrado");
        }
        return client.getLoans() < 5 && client.getLoans() >= 0 && client.getStateClient().equals("ACTIVO");
    }



    public ClientFull getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        return mapToClientFull(client);
    }

    public ClientFull getClientByUserId(Long userId){
        Client client = clientRepository.findByUserId(userId);
        if (client == null){
            throw new RuntimeException("Cliente no encontrado");
        }
        return mapToClientFull(client);
    }

    public List<ClientFull> getAllClients() {
        List<Client> clients = clientRepository.findAll();
        return clients.stream()
                .map(this::mapToClientFull)
                .collect(Collectors.toList());
    }

    public void updateClientState(Long userId, String newState) {
        Client client = clientRepository.findByUserId(userId);
        if (client == null) {
            throw new RuntimeException("Cliente no encontrado para actualizar estado");
        }

        client.setStateClient(newState);
        clientRepository.save(client);
    }

    public List<ClientFull> filterByState(String state) {
        if (state == null || state.isBlank()) {
            return getAllClients();
        }
        List<Client> clients = clientRepository.findByStateClient(state);
        return clients.stream()
                .map(this::mapToClientFull)
                .collect(Collectors.toList());
    }

    private ClientFull mapToClientFull(Client client) {
        User user = null;
        try {
            String url = userServiceUrl + "/id/" + client.getUserId();
            user = restTemplate.getForObject(url, User.class);
        } catch (Exception e) {
            System.err.println("Error conectando con Users-Service: " + e.getMessage());
        }

        return new ClientFull(
                client.getId(),
                client.getLoans(),
                client.getStateClient(),
                user
        );
    }
}
