package com.chickendelivery.controller;

import com.chickendelivery.dto.ReturnRequestUpdate;
import com.chickendelivery.dto.ReturnRequestResponse;
import com.chickendelivery.service.ReturnRequestService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/returns")
public class AdminReturnRequestController {

    private final ReturnRequestService service;

    public AdminReturnRequestController(ReturnRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> all() {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "returnRequests", service.all()
                )
        );
    }

    @PutMapping("/{returnRequestId}/status")
    public ResponseEntity<?> update(
            @PathVariable Long returnRequestId,
            @Valid @RequestBody ReturnRequestUpdate request
    ) {
        try {
            ReturnRequestResponse result = service.update(
                    returnRequestId,
                    request
            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Return request updated successfully.",
                            "returnRequest", result
                    )
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );
        }
    }
}