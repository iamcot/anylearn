package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;

/**
 * Values for the NOT NULL columns of {@code users} that every new account needs.
 * Hibernate inserts every column, so a null here fails the insert even when the column has a DB default.
 */
final class NewUserDefaults {

    private NewUserDefaults() {}

    static void apply(User user) {
        user.setStatus((byte) 1);
        user.setIsChild((byte) 0);
        user.setIsSigned((byte) 0);
        user.setUserCategoryId(0);
        user.setPackageId(0);
        user.setExpire(0);
        user.setWalletM(0L);
        user.setWalletC(0L);
        user.setIsHot((byte) 0);
        user.setCommissionRate(0.0);
        user.setNumFriends(0);
        user.setIsTest((byte) 0);
        user.setIsRegistered((byte) 0);
        user.setUpdateDoc((byte) 0);
        user.setSalePriority(0);
        user.setGetRefSeller(false);
        user.setDobYearOnly(false);
    }
}
