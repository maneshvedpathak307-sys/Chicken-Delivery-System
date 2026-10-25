package com.chickendelivery.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chickendelivery.dto.AddressRequest;
import com.chickendelivery.dto.AddressResponse;
import com.chickendelivery.service.AddressService;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    // =========================================================
    // GET MY ADDRESSES
    // =========================================================

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyAddresses(
            Authentication authentication) {

        List<AddressResponse> addresses =
                addressService.getMyAddresses(
                        authentication.getName()
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        response.put(
                "message",
                "Addresses fetched successfully"
        );

        response.put("count", addresses.size());

        response.put("addresses", addresses);

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // ADD ADDRESS
    // =========================================================

    @PostMapping
    public ResponseEntity<Map<String, Object>> addAddress(
            Authentication authentication,
            @Valid @RequestBody AddressRequest request) {

        AddressResponse address =
                addressService.addAddress(
                        authentication.getName(),
                        request
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        response.put(
                "message",
                "Address added successfully"
        );

        response.put("address", address);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // UPDATE ADDRESS
    // =========================================================

    @PutMapping("/{addressId}")
    public ResponseEntity<Map<String, Object>> updateAddress(
            Authentication authentication,
            @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {

        AddressResponse address =
                addressService.updateAddress(
                        authentication.getName(),
                        addressId,
                        request
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        response.put(
                "message",
                "Address updated successfully"
        );

        response.put("address", address);

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // SET DEFAULT ADDRESS
    // =========================================================

    @PutMapping("/{addressId}/default")
    public ResponseEntity<Map<String, Object>> setDefaultAddress(
            Authentication authentication,
            @PathVariable Long addressId) {

        AddressResponse address =
                addressService.setDefaultAddress(
                        authentication.getName(),
                        addressId
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        response.put(
                "message",
                "Default address updated successfully"
        );

        response.put("address", address);

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // DELETE ADDRESS
    // =========================================================

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Map<String, Object>> deleteAddress(
            Authentication authentication,
            @PathVariable Long addressId) {

        addressService.deleteAddress(
                authentication.getName(),
                addressId
        );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("success", true);

        response.put(
                "message",
                "Address deleted successfully"
        );

        return ResponseEntity.ok(response);
    }
}