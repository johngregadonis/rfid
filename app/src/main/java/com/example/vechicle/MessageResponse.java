package com.example.vechicle;


import java.util.List;

public class MessageResponse {
    private boolean success;
    private List<Message> messages;

    public boolean isSuccess() {
        return success;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public static class Message {
        private String message;

        public String getMessage() {
            return message;
        }
    }
}
//old
