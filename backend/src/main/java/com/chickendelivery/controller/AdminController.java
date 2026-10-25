package com.chickendelivery.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chickendelivery.dto.AdminUserResponse;
import com.chickendelivery.dto.OrderResponse;
import com.chickendelivery.dto.UpdateUserStatusRequest;
import com.chickendelivery.entity.OrderStatus;
import com.chickendelivery.service.AdminService;
import com.chickendelivery.service.OrderService;
import com.chickendelivery.service.ReportPdfService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final OrderService orderService;
    private final ReportPdfService reportPdfService;

    public AdminController(
            AdminService adminService,
            OrderService orderService,
            ReportPdfService reportPdfService) {

        this.adminService = adminService;
        this.orderService = orderService;
        this.reportPdfService = reportPdfService;
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> adminTest(
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "Admin access successful");
        response.put("email", authentication.getName());
        response.put("role", "ADMIN");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "Dashboard data fetched successfully");
        response.put("data", adminService.getDashboardStats());

        return ResponseEntity.ok(response);
    }

    // ADMIN REPORT DATA FOR A SELECTED DATE
    // GET /api/admin/reports?date=2026-10-09

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> reports(
            @RequestParam(required = false) LocalDate date) {

        LocalDate selectedDate =
                date != null ? date : LocalDate.now();

        if (selectedDate.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(
                    errorResponse("Future-date reports are not allowed.")
            );
        }

        Map<String, Object> report =
                adminService.getReportStats(selectedDate);

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Report fetched successfully for " + selectedDate
        );
        response.put("data", report);

        return ResponseEntity.ok(response);
    }

    // DOWNLOAD PDF FOR A SELECTED DATE
    // GET /api/admin/reports/pdf?date=2026-10-09

    @GetMapping("/reports/pdf")
    public ResponseEntity<?> downloadReportPdf(
            @RequestParam(required = false) LocalDate date) {

        LocalDate selectedDate =
                date != null ? date : LocalDate.now();

        if (selectedDate.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(
                    errorResponse("Future-date reports are not allowed.")
            );
        }

        Map<String, Object> report =
                adminService.getReportStats(selectedDate);

        byte[] pdfBytes =
                reportPdfService.generateDailyReportPdf(report);

        String fileName =
                "Chicken-Delivery-Report-" + selectedDate + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\""
                )
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }

    private Map<String, Object> errorResponse(String message) {

        Map<String, Object> response = new HashMap<>();

        response.put("success", false);
        response.put("message", message);

        return response;
    }

    // ADMIN - TODAY'S ORDERS

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> getTodayOrders() {

        List<OrderResponse> orders = orderService.getAllOrders();

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "All orders fetched successfully, including cancelled orders."
        );
        response.put("count", orders.size());
        response.put("orders", orders);

        return ResponseEntity.ok(response);
    }

    // ADMIN - VIEW PARTICULAR ORDER

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrder(
            @PathVariable Long orderId) {

        OrderResponse order = orderService.getOrderById(orderId);

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "Order details fetched successfully");
        response.put("order", order);

        return ResponseEntity.ok(response);
    }

    // ADMIN - UPDATE ORDER STATUS

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {

        Map<String, Object> response = new HashMap<>();

        try {
            OrderResponse updatedOrder =
                    orderService.updateOrderStatus(orderId, status);

            response.put("success", true);
            response.put("message", "Order status updated successfully");
            response.put("order", updatedOrder);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException exception) {

            response.put("success", false);
            response.put(
                    "message",
                    exception.getMessage() != null
                            ? exception.getMessage()
                            : "Invalid order status request"
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // GET ALL USERS

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {

        List<AdminUserResponse> users = adminService.getAllUsers();

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "Users fetched successfully");
        response.put("count", users.size());
        response.put("users", users);

        return ResponseEntity.ok(response);
    }

    // ACTIVATE / DEACTIVATE USER

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable("id") Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {

        AdminUserResponse updatedUser =
                adminService.updateUserStatus(
                        userId,
                        request.getActive()
                );

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                Boolean.TRUE.equals(request.getActive())
                        ? "User activated successfully"
                        : "User deactivated successfully"
        );
        response.put("user", updatedUser);

        return ResponseEntity.ok(response);
    }

    // DELETE USER

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @PathVariable("id") Long userId) {

        adminService.deleteUser(userId);

        Map<String, Object> response = new HashMap<>();

        response.put("success", true);
        response.put("message", "User deleted successfully");

        return ResponseEntity.ok(response);
    }
}