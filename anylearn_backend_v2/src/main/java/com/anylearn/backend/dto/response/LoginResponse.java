package com.anylearn.backend.dto.response;

import com.anylearn.backend.entity.User;
import lombok.Getter;

@Getter
public class LoginResponse {
    private final Long id;
    private final String name;
    private final String firstName;
    private final String phone;
    private final String email;
    private final String role;
    private final Byte status;
    private final String apiToken;
    private final String jwtToken;
    private final String image;
    private final Long walletM;
    private final Long walletC;

    public LoginResponse(User user, String jwtToken) {
        this.id = user.getId();
        this.name = user.getName();
        this.firstName = user.getFirstName();
        this.phone = user.getPhone();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.status = user.getStatus();
        this.apiToken = user.getApiToken();
        this.jwtToken = jwtToken;
        this.image = user.getImage();
        this.walletM = user.getWalletM();
        this.walletC = user.getWalletC();
    }
}
