package com.chickendelivery.dto;

import com.chickendelivery.entity.ReturnRequestStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReturnRequestUpdate {

    @NotNull
    private ReturnRequestStatus status;

    @Size(max = 1000)
    private String adminNote;

    // Optional note describing cash handover.
    @Size(max = 150)
    private String refundReference;

    public ReturnRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ReturnRequestStatus status) {
        this.status = status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public String getRefundReference() {
        return refundReference;
    }

    public void setRefundReference(String refundReference) {
        this.refundReference = refundReference;
    }
}