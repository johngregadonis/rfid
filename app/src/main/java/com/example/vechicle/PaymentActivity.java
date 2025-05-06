package com.example.vechicle;

import android.content.Intent;
import android.net.Uri;
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

public class PaymentActivity extends AppCompatActivity {
    EditText amountInput, bodyNumberInput;
    Button payButton;
    String SERVER_URL = "http://192.168.1.6:3001/process-payment"; // Replace with your backend server IP

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payment);

        amountInput = findViewById(R.id.amountInput);
        bodyNumberInput = findViewById(R.id.bodyNumberInput);
        payButton = findViewById(R.id.payButton);

        payButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String amount = amountInput.getText().toString();
                String bodyNumber = bodyNumberInput.getText().toString();

                if (amount.isEmpty() || bodyNumber.isEmpty()) {
                    Toast.makeText(PaymentActivity.this, "Enter all details", Toast.LENGTH_SHORT).show();
                    return;
                }

                initiatePayment(Double.parseDouble(amount), bodyNumber);
            }
        });
    }

    private void initiatePayment(double amount, String bodyNumber) {
        JSONObject requestBody = new JSONObject();
        try {
            requestBody.put("amount", amount);
            requestBody.put("bodyNumber", bodyNumber);
        } catch (JSONException e) {
            Toast.makeText(this, "JSON Error", Toast.LENGTH_SHORT).show();
            return;
        }

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, SERVER_URL, requestBody,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        try {
                            if (response.has("gcash_url")) {
                                String checkoutUrl = response.getString("gcash_url");
                                double newBalance = response.getDouble("new_balance");

                                // Show updated balance
                                Toast.makeText(PaymentActivity.this, "Payment Successful! New Balance: ₱" + newBalance, Toast.LENGTH_LONG).show();

                                // Open GCash Payment Link
                                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(checkoutUrl));
                                startActivity(intent);
                            } else {
                                Toast.makeText(PaymentActivity.this, "Payment link not received", Toast.LENGTH_SHORT).show();
                            }
                        } catch (JSONException e) {
                            Toast.makeText(PaymentActivity.this, "Response Error", Toast.LENGTH_SHORT).show();
                        }
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(PaymentActivity.this, "Payment failed! " + error.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });

        RequestQueue queue = Volley.newRequestQueue(this);
        queue.add(request);
    }
}
