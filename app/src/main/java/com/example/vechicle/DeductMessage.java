package com.example.vechicle;

public class DeductMessage {
    private String deductMessage;
    private String createdAt;

    public DeductMessage(String deductMessage, String createdAt) {
        this.deductMessage = deductMessage;
        this.createdAt = createdAt;
    }

    public String getDeductMessage() {
        return deductMessage;
    }

    public void setDeductMessage(String deductMessage) {
        this.deductMessage = deductMessage;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
