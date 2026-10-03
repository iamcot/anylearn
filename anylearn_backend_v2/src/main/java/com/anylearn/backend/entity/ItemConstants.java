package com.anylearn.backend.entity;

public final class ItemConstants {

    // Item types
    public static final String TYPE_COURSE  = "course";
    public static final String TYPE_CLASS   = "class";
    public static final String TYPE_PRODUCT = "product";

    // Subtypes
    public static final String SUBTYPE_ONLINE     = "online";
    public static final String SUBTYPE_DIGITAL    = "digital";
    public static final String SUBTYPE_OFFLINE    = "offline";
    public static final String SUBTYPE_EXTRA      = "extra";
    public static final String SUBTYPE_VIDEO      = "video";
    public static final String SUBTYPE_PRESCHOOL  = "preschool";

    // status (admin toggle)
    public static final byte STATUS_INACTIVE = 0;
    public static final byte STATUS_ACTIVE   = 1;

    // userStatus (teacher/school toggle)
    public static final byte USERSTATUS_INACTIVE = 0;
    public static final byte USERSTATUS_ACTIVE   = 1;
    public static final byte USERSTATUS_DONE     = 99;

    // Activation support
    public static final String ACTIVATION_MANUAL = "manual";
    public static final String ACTIVATION_API    = "api";

    private ItemConstants() {}
}
