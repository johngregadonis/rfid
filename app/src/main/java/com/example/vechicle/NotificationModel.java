package com.example.vechicle;
public class NotificationModel {
    private String message;
    private String timestamp;

    public NotificationModel(String message, String timestamp) {
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getMessage() {
        return message;
    }

    public String getTimestamp() {
        return timestamp;
    }
}
//old