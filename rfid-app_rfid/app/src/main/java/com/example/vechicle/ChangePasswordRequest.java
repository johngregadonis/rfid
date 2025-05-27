package com.example.vechicle;

public class ChangePasswordRequest {
    private int user_id;
    private String current_password;
    private String new_password;
    private String current_session_token;

    public ChangePasswordRequest(int user_id, String current_password, String new_password, String current_session_token) {
        this.user_id = user_id;
        this.current_password = current_password;
        this.new_password = new_password;
        this.current_session_token = current_session_token;
    }
}