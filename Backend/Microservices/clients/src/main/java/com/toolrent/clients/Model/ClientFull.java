package com.toolrent.clients.Model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientFull {

    private Long id;
    private int loans;
    private String stateClient;
    private User user;
}
