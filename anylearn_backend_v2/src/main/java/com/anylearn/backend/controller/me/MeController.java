package com.anylearn.backend.controller.me;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v3")
public class MeController {

    @GetMapping("/meAPI")
    public ApiResponse<?> index() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/meWork")
    public ApiResponse<?> meWork() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/courseconfirm")
    public ApiResponse<?> courseConfirm() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/admitstudent/{id}")
    public ApiResponse<?> admitStudent(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/getchild")
    public ApiResponse<?> getChildAccounts() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping({"/child/{id}", "/child"})
    public ApiResponse<?> childAccount(@PathVariable(required = false) Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/class")
    public ApiResponse<?> list() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/categories")
    public ApiResponse<?> getCategories() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/students/{id}")
    public ApiResponse<?> getStudents(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/getextrafee/{id}")
    public ApiResponse<?> getExtrafee(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/extrafee/{id}")
    public ApiResponse<?> addExtrafee(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/cancel-pending/{orderId}")
    public ApiResponse<?> cancelPending(@PathVariable Long orderId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/locations")
    public ApiResponse<?> locations() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/order-return")
    public ApiResponse<?> deliveredOrders() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/order-return/send-request/{orderId}")
    public ApiResponse<?> sendReturnRequest(@PathVariable Long orderId) {
        return ApiResponse.fail("Not implemented");
    }

    @RequestMapping(value = "/api/user/certificate", method = {RequestMethod.GET, RequestMethod.POST})
    public ApiResponse<?> certificate() {
        return ApiResponse.fail("Not implemented");
    }

    @RequestMapping(value = "/api/user/listcertificate", method = {RequestMethod.GET, RequestMethod.POST})
    public ApiResponse<?> listCertificate() {
        return ApiResponse.fail("Not implemented");
    }
}
