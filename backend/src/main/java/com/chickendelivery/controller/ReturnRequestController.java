package com.chickendelivery.controller;

import com.chickendelivery.dto.ReturnRequestCreate;
import com.chickendelivery.dto.ReturnRequestResponse;
import com.chickendelivery.service.ReturnRequestService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/returns")
public class ReturnRequestController {

    private final ReturnRequestService service;

    public ReturnRequestController(ReturnRequestService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<?> create(
            Authentication authentication,
            @Valid @RequestBody ReturnRequestCreate request
    ) {
        try {
            ReturnRequestResponse result = service.create(
                    authentication.getName(),
                    request
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put(
                    "message",
                    "Return request submitted. Our team will review it "
                            + "and arrange pickup if approved."
            );
            response.put("returnRequest", result);

            return ResponseEntity.status(201).body(response);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> mine(Authentication authentication) {
        try {
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "returnRequests",
                            service.mine(authentication.getName())
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

    @PostMapping("/{returnRequestId}/confirm-cash-received")
    public ResponseEntity<?> confirmCashReceived(
            Authentication authentication,
            @PathVariable Long returnRequestId
    ) {
        try {
            ReturnRequestResponse result =
                    service.confirmCashReceived(
                            returnRequestId,
                            authentication.getName()
                    );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put(
                    "message",
                    "Cash receipt confirmed successfully."
            );
            response.put("returnRequest", result);

            return ResponseEntity.ok(response);

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