package com.example.vechicle;

public class Message {
    private String messageText;
    private String createdAt;

    public Message(String messageText, String createdAt) {
        this.messageText = messageText;
        this.createdAt = createdAt;
    }

    public String getMessageText() {
        return messageText;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}
