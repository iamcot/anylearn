package com.anylearn.backend.controller.open;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/open")
public class OpenApiController {

    @RequestMapping(value = "/class/list", method = {RequestMethod.GET, RequestMethod.POST})
    public ApiResponse<?> classList(@RequestParam(required = false) String partner,
                                     @RequestParam(required = false) String classId,
                                     @RequestParam(required = false) String hash) {
        // TODO: validate SHA-256 hash: sha256(partner + classId + secret)
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/order/purchased")
    public ApiResponse<?> orderPurchased(@RequestBody Object body) {
        // TODO: validate SHA-256 hash before processing
        return ApiResponse.fail("Not implemented");
    }
}
