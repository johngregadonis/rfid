package com.example.vechicle;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class NotificationActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private NotificationAdapter adapter;
    private List<NotificationModel> notificationList = new ArrayList<>();
    private static final String API_URL = "http://192.168.38.88:3001/messages";
    private static final String DEDUCT_API_URL = "http://192.168.38.88:3001/deduct-messages";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.notification);

        recyclerView = findViewById(R.id.recyclerView);
        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        recyclerView.setLayoutManager(layoutManager);  // Display from top to bottom

        adapter = new NotificationAdapter(notificationList);
        recyclerView.setAdapter(adapter);

        fetchMessages(); // Fetch regular messages
        fetchDeductMessages(); // Fetch deduct messages
    }

    private void fetchMessages() {
        SharedPreferences sharedPreferences = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        String bodyNumber = sharedPreferences.getString("bodyNumber", null);

        if (bodyNumber == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            return;
        }

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
                .url(API_URL)
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
                                String formattedTime = formatTimestamp(timestamp);
                                notificationList.add(new NotificationModel(content, formattedTime));
                            }
                            sortMessagesByTimestampDescending(); // Sort in reverse chronological order
                            runOnUiThread(() -> {
                                adapter.notifyDataSetChanged();
                                recyclerView.scrollToPosition(0); // Scroll to the top after new data is added
                            });
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

    private void fetchDeductMessages() {
        SharedPreferences sharedPreferences = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        String bodyNumber = sharedPreferences.getString("bodyNumber", null);

        if (bodyNumber == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            return;
        }

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
                .url(DEDUCT_API_URL)
                .addHeader("body_number", bodyNumber)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    Toast.makeText(NotificationActivity.this, "Failed to fetch deduct messages", Toast.LENGTH_SHORT).show();
                });
                Log.e("NotificationActivity", "Error: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                if (response.isSuccessful()) {
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray messages = jsonResponse.optJSONArray("messages");

                        if (messages != null && messages.length() > 0) {
                            for (int i = 0; i < messages.length(); i++) {
                                JSONObject messageObj = messages.getJSONObject(i);
                                String content = messageObj.optString("deduct_message", "No message content");
                                String timestamp = messageObj.optString("created_at", "");
                                String formattedTime = formatTimestamp(timestamp);
                                notificationList.add(new NotificationModel(content, formattedTime));
                            }
                            sortMessagesByTimestampDescending(); // Sort in reverse chronological order
                            runOnUiThread(() -> {
                                adapter.notifyDataSetChanged();
                                recyclerView.scrollToPosition(0); // Scroll to the top after new data is added
                            });
                        } else {
                            runOnUiThread(() -> {
                                Toast.makeText(NotificationActivity.this, "No deduct messages available", Toast.LENGTH_SHORT).show();
                            });
                        }
                    } catch (Exception e) {
                        Log.e("NotificationActivity", "Error parsing JSON: " + e.getMessage());
                        runOnUiThread(() -> {
                            Toast.makeText(NotificationActivity.this, "Error parsing response", Toast.LENGTH_SHORT).show();
                        });
                    }
                } else {
                    runOnUiThread(() -> {
                        Toast.makeText(NotificationActivity.this, "Failed to load deduct messages", Toast.LENGTH_SHORT).show();
                    });
                }
            }
        });
    }

    private void sortMessagesByTimestampDescending() {
        notificationList.sort((message1, message2) -> {
            try {
                SimpleDateFormat format = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                Date date1 = format.parse(message1.getTimestamp());
                Date date2 = format.parse(message2.getTimestamp());
                return date2.compareTo(date1);  // Reverse the order to have the latest message first
            } catch (ParseException e) {
                Log.e("NotificationActivity", "Error parsing timestamp for sorting: " + e.getMessage());
                return 0;
            }
        });
    }

    private String formatTimestamp(String timestamp) {
        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
        outputFormat.setTimeZone(TimeZone.getDefault());

        try {
            Date date = inputFormat.parse(timestamp);
            return outputFormat.format(date);
        } catch (ParseException e) {
            Log.e("NotificationActivity", "Error parsing timestamp: " + e.getMessage());
            return timestamp;
        }
    }
}
