package com.anylearn.backend.dto.response;

import com.anylearn.backend.entity.User;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class UserInfoResponse {
    private final Long id;
    private final String name;
    private final String firstName;
    private final String phone;
    private final String email;
    private final String role;
    private final Byte status;
    private final String apiToken;
    private final String image;
    private final String banner;
    private final String introduce;
    private final String fullContent;
    private final String title;
    private final String address;
    private final LocalDate dob;
    private final String sex;
    private final Long walletM;
    private final Long walletC;
    private final String refcode;
    private final String reflink;

    public UserInfoResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.firstName = user.getFirstName();
        this.phone = user.getPhone();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.status = user.getStatus();
        this.apiToken = user.getApiToken();
        this.image = user.getImage();
        this.banner = user.getBanner();
        this.introduce = user.getIntroduce();
        this.fullContent = user.getFullContent();
        this.title = user.getTitle();
        this.address = user.getAddress();
        this.dob = user.getDob();
        this.sex = user.getSex();
        this.walletM = user.getWalletM();
        this.walletC = user.getWalletC();
        this.refcode = user.getRefcode();
        this.reflink = "https://anylearn.vn/ref/" + user.getRefcode();
    }
}
