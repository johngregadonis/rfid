package com.example.vechicle;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

public class LoginActivity extends AppCompatActivity {
    private EditText bodyNumberField, passwordField;
    private Button loginButton;
    private ImageView passwordToggle;
    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Check if the user is already logged in
        SharedPreferences sharedPreferences = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        boolean isLoggedIn = sharedPreferences.getBoolean("isLoggedIn", false);

        if (isLoggedIn) {
            // If already logged in, navigate to HomeActivity
            Intent intent = new Intent(LoginActivity.this, HomeActivity.class);
            startActivity(intent);
            finish();
            return; // Exit onCreate
        }

        bodyNumberField = findViewById(R.id.bodyNumber);
        passwordField = findViewById(R.id.password);
        loginButton = findViewById(R.id.login_button);
        passwordToggle = findViewById(R.id.passwordToggle); // Add this in your XML layout

        // Password visibility toggle feature
        passwordToggle.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                isPasswordVisible = !isPasswordVisible;
                if (isPasswordVisible) {
                    passwordField.setInputType(InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                    passwordToggle.setImageResource(R.drawable.baseline_visibility_24);
                } else {
                    passwordField.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                    passwordToggle.setImageResource(R.drawable.baseline_visibility_off_24);
                }
                passwordField.setSelection(passwordField.getText().length()); // Keep cursor at the end
            }
        });

        loginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loginUser();
            }
        });
    }

    private void loginUser() {
        String bodyNumber = bodyNumberField.getText().toString().trim();
        String password = passwordField.getText().toString().trim();

        if (bodyNumber.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields.", Toast.LENGTH_SHORT).show();
            return;
        }

        String url = "http://192.168.38.88:3001/login"; // Update with your server URL

        // Create JSON payload
        JSONObject loginData = new JSONObject();
        try {
            loginData.put("bodyNumber", bodyNumber);
            loginData.put("password", password);
        } catch (JSONException e) {
            e.printStackTrace();
            Toast.makeText(this, "Error creating login data.", Toast.LENGTH_SHORT).show();
            return;
        }

        // Send login request
        RequestQueue queue = Volley.newRequestQueue(this);

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(
                Request.Method.POST,
                url,
                loginData,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        try {
                            String name = response.getString("name");
                            String bodyNumber = response.getString("bodyNumber");

                            // Save login state in SharedPreferences
                            SharedPreferences sharedPreferences = getSharedPreferences("UserPrefs", MODE_PRIVATE);
                            SharedPreferences.Editor editor = sharedPreferences.edit();
                            editor.putString("name", name);
                            editor.putString("bodyNumber", bodyNumber);
                            editor.putBoolean("isLoggedIn", true); // Save login state
                            editor.apply();

                            Toast.makeText(LoginActivity.this, "Welcome, " + name + "!", Toast.LENGTH_SHORT).show();

                            // Navigate to HomeActivity
                            Intent intent = new Intent(LoginActivity.this, HomeActivity.class);
                            startActivity(intent);
                            finish(); // Close LoginActivity

                        } catch (JSONException e) {
                            e.printStackTrace();
                            Toast.makeText(LoginActivity.this, "Unexpected response. Please try again.", Toast.LENGTH_SHORT).show();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        handleError(error);
                    }
                }
        );

        queue.add(jsonObjectRequest);
    }

    private void handleError(VolleyError error) {
        String errorMessage = "Login failed. Check your credentials.";
        if (error.networkResponse != null) {
            int statusCode = error.networkResponse.statusCode;
            byte[] data = error.networkResponse.data;

            if (data != null) {
                try {
                    String serverResponse = new String(data, "UTF-8");
                    switch (statusCode) {
                        case 404:
                            errorMessage = "User not found.";
                            break;
                        case 401:
                            errorMessage = "Invalid password.";
                            break;
                        case 500:
                            errorMessage = "Internal server error.";
                            break;
                        default:
                            errorMessage = "Error " + statusCode + ": " + serverResponse;
                            break;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        } else if (error instanceof com.android.volley.TimeoutError) {
            errorMessage = "Request timed out. Check your network connection.";
        } else if (error instanceof com.android.volley.NoConnectionError) {
            errorMessage = "No network connection.";
        }

        Toast.makeText(LoginActivity.this, errorMessage, Toast.LENGTH_LONG).show();
    }
}
