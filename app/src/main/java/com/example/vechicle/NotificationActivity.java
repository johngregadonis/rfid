package com.example.vechicle;

import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.content.SharedPreferences;
import java.util.TimeZone;


import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class NotificationActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private NotificationAdapter adapter;
    private List<NotificationModel> notificationList = new ArrayList<>();
    private static final String API_URL = "http://192.168.1.7:3001/messages";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.notification);

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        adapter = new NotificationAdapter(notificationList);
        recyclerView.setAdapter(adapter);

        fetchMessages(); // Automatically fetch messages based on the logged-in user's body_number
    }

    private void fetchMessages() {
        // Retrieve the logged-in user's body_number from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        String bodyNumber = sharedPreferences.getString("bodyNumber", null);

        if (bodyNumber == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            return;
        }

        OkHttpClient client = new OkHttpClient();

        // Use body_number as part of the request header instead of the URL
        Request request = new Request.Builder()
                .url(API_URL)  // No need for bodyNumber in the URL anymore
                .addHeader("body_number", bodyNumber)  // Send body_number in headers
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    Toast.makeText(NotificationActivity.this, "Failed to fetch messages", Toast.LENGTH_SHORT).show();
                });
                Log.e("NotificationActivity", "Error: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray messages = jsonResponse.getJSONArray("messages");

                        if (messages.length() > 0) {
                            for (int i = 0; i < messages.length(); i++) {
                                JSONObject messageObj = messages.getJSONObject(i);
                                String content = messageObj.getString("message");
                                String timestamp = messageObj.getString("timestamp");

                                // Format the timestamp into a readable date and time
                                String formattedTime = formatTimestamp(timestamp);

                                // Add the formatted time and message to the list
                                notificationList.add(new NotificationModel(content, formattedTime));
                            }

                            runOnUiThread(() -> adapter.notifyDataSetChanged());
                        } else {
                            runOnUiThread(() -> {
                                Toast.makeText(NotificationActivity.this, "No messages available", Toast.LENGTH_SHORT).show();
                            });
                        }
                    } catch (Exception e) {
                        Log.e("NotificationActivity", "Error parsing JSON: " + e.getMessage());
                    }
                } else {
                    runOnUiThread(() -> {
                        Toast.makeText(NotificationActivity.this, "Failed to load messages", Toast.LENGTH_SHORT).show();
                    });
                }
            }
        });
    }

    private String formatTimestamp(String timestamp) {
        // Assuming timestamp is in ISO 8601 format (e.g., "2025-01-11T14:30:00")
        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");

        // Set the time zone to UTC (or the desired time zone)
        inputFormat.setTimeZone(TimeZone.getTimeZone("UTC")); // Adjust to the correct timezone if necessary

        // Output format for displaying the timestamp
        SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");

        // Optionally, you can set the output format's timezone to the device's default timezone
        outputFormat.setTimeZone(TimeZone.getDefault()); // Device's local timezone

        try {
            Date date = inputFormat.parse(timestamp);
            return outputFormat.format(date);
        } catch (ParseException e) {
            Log.e("NotificationActivity", "Error parsing timestamp: " + e.getMessage());
            return timestamp; // Return the original timestamp if parsing fails
        }
    }

}