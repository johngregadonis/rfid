package com.example.vechicle;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPrefs";
    private ConstraintLayout logoutButton, changePasswordButton, about_us_layout, terms_privacy_layout, help_layout,  btnLogoutAllDevices;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        // Initialize UI components
        logoutButton = findViewById(R.id.logout_button);
        changePasswordButton = findViewById(R.id.change_password_button);
        about_us_layout = findViewById(R.id.about_us_layout);
        terms_privacy_layout = findViewById(R.id.terms_privacy_layout);
        help_layout = findViewById(R.id.help_layout);
        btnLogoutAllDevices = findViewById(R.id.btnLogoutAllDevices);

        // Local logout
        logoutButton.setOnClickListener(v -> {
            logout();
            Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });

        // Logout all devices
        btnLogoutAllDevices.setOnClickListener(v -> logoutAllDevices());

        // Change password
        changePasswordButton.setOnClickListener(v ->
                startActivity(new Intent(SettingsActivity.this, ChangePasswordActivity.class)));

        // About Us
        about_us_layout.setOnClickListener(v ->
                startActivity(new Intent(SettingsActivity.this, AboutUsActivity.class)));

        // Terms and Privacy
        terms_privacy_layout.setOnClickListener(v ->
                startActivity(new Intent(SettingsActivity.this, TermsActivity.class)));

        // Help
        help_layout.setOnClickListener(v ->
                startActivity(new Intent(SettingsActivity.this, HelpActivity.class)));

        // Optional: Check token validity every time settings open
        checkTokenValidity();
    }

    // Local logout
    private void logout() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.clear();
        editor.apply();
        Toast.makeText(SettingsActivity.this, "You have been logged out.", Toast.LENGTH_SHORT).show();
    }

    // Logout all devices
    private void logoutAllDevices() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String token = prefs.getString("token", null);

        if (token == null) {
            Toast.makeText(this, "No session token found", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiService apiService = RetrofitClient.getInstance(this).create(ApiService.class);
        Call<ResponseBody> call = apiService.logoutAllDevices("Bearer " + token);

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(SettingsActivity.this, "Logged out from all devices", Toast.LENGTH_SHORT).show();

                    SharedPreferences.Editor editor = prefs.edit();
                    editor.clear();
                    editor.apply();

                    Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                } else if (response.code() == 401) {
                    // Token invalid
                    SharedPreferences.Editor editor = prefs.edit();
                    editor.clear();
                    editor.apply();

                    Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(SettingsActivity.this, "Logout failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(SettingsActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    // Check token validity
    private void checkTokenValidity() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String token = prefs.getString("token", null);

        if (token != null) {
            ApiService apiService = RetrofitClient.getInstance(this).create(ApiService.class);
            Call<ResponseBody> call = apiService.checkTokenValidity("Bearer " + token);

            call.enqueue(new Callback<ResponseBody>() {
                @Override
                public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                    if (response.code() == 401) {
                        SharedPreferences.Editor editor = prefs.edit();
                        editor.clear();
                        editor.apply();

                        // Show a Toast message informing the user about the session expiration
                        Toast.makeText(SettingsActivity.this, "Session expired. Login again.", Toast.LENGTH_LONG).show();


                        Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
                        startActivity(intent);
                        finish();
                    }
                }

                @Override
                public void onFailure(Call<ResponseBody> call, Throwable t) {
                    Toast.makeText(SettingsActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
