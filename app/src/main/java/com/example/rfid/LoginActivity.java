package com.example.rfid;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        bodyNumberField = findViewById(R.id.bodyNumber);
        passwordField = findViewById(R.id.password);
        loginButton = findViewById(R.id.login_button);

        loginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loginUser();
            }
        });
    }

    private void loginUser() {
        String bodyNumber = bodyNumberField.getText().toString();
        String password = passwordField.getText().toString();

        if (bodyNumber.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields.", Toast.LENGTH_SHORT).show();
            return;
        }

        String url = "http://10.0.2.2:3001/login"; // Emulator localhost

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

                            Toast.makeText(
                                    LoginActivity.this,
                                    "Welcome, " + name + " (" + bodyNumber + ")!",
                                    Toast.LENGTH_LONG
                            ).show();

                            // Proceed to the next screen
                        } catch (JSONException e) {
                            e.printStackTrace();
                            Toast.makeText(
                                    LoginActivity.this,
                                    "Unexpected response. Please try again.",
                                    Toast.LENGTH_SHORT
                            ).show();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        String errorMessage = "Login failed. Check your credentials.";
                        String serverResponse = null;

                        // Check if there is a network response
                        if (error.networkResponse != null) {
                            int statusCode = error.networkResponse.statusCode;
                            byte[] data = error.networkResponse.data;

                            // Attempt to parse server response
                            if (data != null) {
                                try {
                                    serverResponse = new String(data, "UTF-8");
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }

                            // Adjust error messages based on HTTP status code
                            switch (statusCode) {
                                case 404:
                                    errorMessage = "User not found. Server response: " + serverResponse;
                                    break;
                                case 401:
                                    errorMessage = "Invalid password. Server response: " + serverResponse;
                                    break;
                                case 500:
                                    errorMessage = "Internal server error. Please try again later.";
                                    break;
                                default:
                                    errorMessage = "Error " + statusCode + ": " + serverResponse;
                                    break;
                            }
                        } else if (error instanceof com.android.volley.TimeoutError) {
                            errorMessage = "Request timed out. Check your network connection.";
                        } else if (error instanceof com.android.volley.NoConnectionError) {
                            errorMessage = "No network connection. Please check your connection.";
                        } else {
                            errorMessage = "Unexpected error occurred: " + error.toString();
                        }

                        // Log the detailed error message for debugging
                        System.out.println("Error Response: " + error.toString());
                        if (serverResponse != null) {
                            System.out.println("Server Response: " + serverResponse);
                        }

                        // Display the error message to the user
                        Toast.makeText(LoginActivity.this, errorMessage, Toast.LENGTH_LONG).show();
                    }

                }
        );

        queue.add(jsonObjectRequest);
    }

}
