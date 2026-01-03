package com.toolrent.clients.Config;

import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.io.IOException;

public class RestTemplateInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Validación del token
        if (authentication instanceof JwtAuthenticationToken jwtToken) {
            // Obtención del valor del token
            String tokenValue = jwtToken.getToken().getTokenValue();
            request.getHeaders().add("Authorization", "Bearer " + tokenValue);
        }

        // Continua la ejecución normal
        return execution.execute(request, body);
    }
}