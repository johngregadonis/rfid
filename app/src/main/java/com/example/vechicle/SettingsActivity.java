package com.example.vechicle;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout; // Import this

public class SettingsActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPrefs"; // SharedPreferences key
    private ConstraintLayout logoutButton, changePasswordButton, about_us_layout, terms_privacy_layout; // Corrected casing

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        // Initialize views
        logoutButton = findViewById(R.id.logout_button);
        changePasswordButton = findViewById(R.id.change_password_button); // Fix declaration
        about_us_layout = findViewById(R.id.about_us_layout);
        terms_privacy_layout = findViewById(R.id.terms_privacy_layout);

        // Set up Logout button click listener
        logoutButton.setOnClickListener(v -> {
            logout(); // Perform logout operation

            // Redirect to LoginActivity
            Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
            startActivity(intent);
            finish(); // Close SettingsActivity so user can't go back using the back button
        });

        // Set up Change Password button click listener
        changePasswordButton.setOnClickListener(v -> {
            // Navigate to ChangePasswordActivity
            Intent intent = new Intent(SettingsActivity.this, ChangePasswordActivity.class);
            startActivity(intent);
        });

        // Set up Change Password button click listener
        about_us_layout.setOnClickListener(v -> {
            // Navigate to ChangePasswordActivity
            Intent intent = new Intent(SettingsActivity.this, AboutUsActivity.class);
            startActivity(intent);
        });

        // Set up Change Password button click listener
        terms_privacy_layout.setOnClickListener(v -> {
            // Navigate to ChangePasswordActivity
            Intent intent = new Intent(SettingsActivity.this, TermsActivity.class);
            startActivity(intent);
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
