package com.anylearn.backend.service.location;

import com.anylearn.backend.service.PersonNames;

import java.util.Arrays;
import java.util.List;

/** Decides whether a Google suggestion is the address written on a contract (house number and street must be in it). */
public final class AddressMatch {

    private static final int MIN_TOKEN_LENGTH = 1;

    private AddressMatch() {}

    /**
     * The first part of the contract address ("12 Nguyễn Huệ" in "12 Nguyễn Huệ, Quận 1") must be found, word by word
     * and ignoring accents, in the suggestion. A contract address with no street part never matches.
     */
    public static boolean confident(String contractAddress, String suggestion) {
        List<String> streetTokens = tokens(firstPart(contractAddress));
        if (streetTokens.isEmpty()) return false;
        List<String> found = tokens(suggestion);
        return found.containsAll(streetTokens);
    }

    static String firstPart(String address) {
        if (address == null) return "";
        int comma = address.indexOf(',');
        return comma < 0 ? address : address.substring(0, comma);
    }

    static List<String> tokens(String text) {
        return Arrays.stream(PersonNames.normalize(text).split("[^a-z0-9]+"))
                .filter(t -> t.length() >= MIN_TOKEN_LENGTH).toList();
    }
}
