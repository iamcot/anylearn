package com.anylearn.backend.service.studio;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/** Whether the current request was made with a machine key (t2m, plan 19.A6). */
public final class StudioRequest {

    private StudioRequest() {}

    public static boolean isMachine() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        return attrs != null && attrs.getAttribute(StudioRules.REQUEST_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST) != null;
    }
}
