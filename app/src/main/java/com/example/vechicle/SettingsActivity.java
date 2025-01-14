package com.example.vechicle;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class SettingsActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPrefs"; // SharedPreferences key
    private Button logoutButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        // Initialize views
        logoutButton = findViewById(R.id.logout_button);

        // Set up Logout button click listener
        logoutButton.setOnClickListener(v -> {
            // Perform logout operation (clear SharedPreferences or session data)
            logout();

            // Redirect to LoginActivity
            Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
            startActivity(intent);
            finish(); // Close SettingsActivity so user can't go back using the back button
        });
    }

    /**
     * Clear the SharedPreferences and any session data for logout.
     */
    private void logout() {
        // Get SharedPreferences and clear all data
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.clear(); // Clear all stored preferences
        editor.apply(); // Apply the changes

        // Optionally, show a toast message to confirm logout
        Toast.makeText(SettingsActivity.this, "You have been logged out.", Toast.LENGTH_SHORT).show();
    }
}
