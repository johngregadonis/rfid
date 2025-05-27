package com.example.vechicle;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.DefaultRetryPolicy;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

public class ForgotPasswordActivity extends AppCompatActivity {
    private EditText emailEditText;
    private Button sendOtpButton;
    private RequestQueue requestQueue;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);

        emailEditText = findViewById(R.id.emailInput);
        sendOtpButton = findViewById(R.id.sendOtpButton);
        requestQueue = Volley.newRequestQueue(this);

        sendOtpButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String email = emailEditText.getText().toString().trim();
                if (email.isEmpty()) {
                    Toast.makeText(ForgotPasswordActivity.this, "Please enter your email", Toast.LENGTH_SHORT).show();
                    return;
                }

                if (!isNetworkAvailable()) {
                    Toast.makeText(ForgotPasswordActivity.this, "No internet connection", Toast.LENGTH_SHORT).show();
                    return;
                }

                sendOtpButton.setEnabled(false);
                sendOtpRequest(email);
            }
        });
    }

    private void sendOtpRequest(String email) {
        String url = "http://192.168.1.3:3001/send-otp?email=" + email;

        StringRequest request = new StringRequest(Request.Method.GET, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        try {
                            JSONObject jsonResponse = new JSONObject(response);
                            boolean success = jsonResponse.getBoolean("success");
                            String message = jsonResponse.optString("message", "Unknown error");

                            if (success) {
                                Toast.makeText(ForgotPasswordActivity.this, message, Toast.LENGTH_SHORT).show();
                                Intent intent = new Intent(ForgotPasswordActivity.this, VerifyOtpActivity.class);
                                intent.putExtra("email", email);
                                startActivity(intent);
                            } else {
                                Toast.makeText(ForgotPasswordActivity.this, "Email address not found", Toast.LENGTH_LONG).show();
                                sendOtpButton.setEnabled(true);
                            }
                        } catch (JSONException e) {
                            Toast.makeText(ForgotPasswordActivity.this, "Error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                            sendOtpButton.setEnabled(true);
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(ForgotPasswordActivity.this, "Failed to send OTP. Try again.", Toast.LENGTH_LONG).show();
                        sendOtpButton.setEnabled(true);
                    }
                });

        // Set a short timeout to ensure fast response
        request.setRetryPolicy(new DefaultRetryPolicy(
                5000, // 5-second timeout
                0,    // No retries
                DefaultRetryPolicy.DEFAULT_BACKOFF_MULT
        ));

        requestQueue.add(request);
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        return activeNetwork != null && activeNetwork.isConnected();
    }
}
