package com.example.vechicle;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

public class SessionManager {
    private static final String PREF_NAME = "UserSession";
    private static final String KEY_PASSWORD_HASH = "passwordHash";
    private static final String KEY_SESSION_TOKEN = "sessionToken";
    private SharedPreferences preferences;
    private SharedPreferences.Editor editor;

    public SessionManager(Context context) {
        preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        editor = preferences.edit();
    }

    public void savePassword(String password) {
        editor.putString(KEY_PASSWORD_HASH, hashPassword(password));
        editor.apply();
    }

    public boolean isCorrectPassword(String inputPassword) {
        String storedHash = preferences.getString(KEY_PASSWORD_HASH, "");
        return storedHash.equals(hashPassword(inputPassword));
    }

    public void generateSessionToken() {
        String token = UUID.randomUUID().toString();
        editor.putString(KEY_SESSION_TOKEN, token);
        editor.apply();
    }

    public String getSessionToken() {
        return preferences.getString(KEY_SESSION_TOKEN, "");
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes());
            return Base64.encodeToString(hash, Base64.DEFAULT).trim();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return "";
        }
    }
}
