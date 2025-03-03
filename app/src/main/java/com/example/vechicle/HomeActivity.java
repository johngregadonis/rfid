package com.example.vechicle; // Fix package name typo

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class HomeActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPrefs"; // SharedPreferences key
    private static final String API_URL = "http://192.168.1.9:3001/messages";
    private static final String DEDUCT_API_URL = "http://192.168.1.9:3001/deduct-messages";

    private TextView nameTextView, balanceTextView, messagesTextView;
    private ImageView photoImageView;
    private SwipeRefreshLayout swipeRefreshLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_home);

        // Initialize views
        nameTextView = findViewById(R.id.user_name);
        balanceTextView = findViewById(R.id.balanceTextView);
        photoImageView = findViewById(R.id.profile_image);
        swipeRefreshLayout = findViewById(R.id.swipe_refresh_layout);
        messagesTextView = findViewById(R.id.messagesTextView);

        // Load user details
        loadUserDetails();
        fetchMessages();
        fetchDeductMessages();

        // Set up swipe-to-refresh listener
        swipeRefreshLayout.setOnRefreshListener(() -> {
            loadUserDetails();
            fetchMessages();
            fetchDeductMessages();
            swipeRefreshLayout.setRefreshing(false);
        });

        // Set up click listeners for icons
        setupIconListeners();
    }

    private void loadUserDetails() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        String name = sharedPreferences.getString("name", "Guest");
        String bodyNumber = sharedPreferences.getString("bodyNumber", null);
        String photoUri = sharedPreferences.getString("imageUri", null);

        nameTextView.setText(name);

        if (photoUri != null) {
            try {
                Uri uri = Uri.parse(photoUri);
                photoImageView.setImageURI(uri);
            } catch (Exception e) {
                Toast.makeText(this, "Error loading photo", Toast.LENGTH_SHORT).show();
            }
        }

        if (bodyNumber != null) {
            fetchBalance(bodyNumber);
        } else {
            balanceTextView.setText("Error: Body number not found");
        }
    }

    private void fetchBalance(String bodyNumber) {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://192.168.1.9:3001/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        ApiService apiService = retrofit.create(ApiService.class);
        Call<Operator> call = apiService.getOperatorDetails(bodyNumber);

        call.enqueue(new Callback<Operator>() {
            @Override
            public void onResponse(Call<Operator> call, Response<Operator> response) {
                if (response.isSuccessful() && response.body() != null) {
                    String balance = response.body().getBalance();
                    balanceTextView.setText("₱" + balance);
                } else {
                    balanceTextView.setText("Failed to fetch balance");
                }
            }

            @Override
            public void onFailure(Call<Operator> call, Throwable t) {
                balanceTextView.setText("Error: " + t.getMessage());
            }
        });
    }

    private void setupIconListeners() {
        ImageView profileIcon = findViewById(R.id.profile_icon);
        ImageView notificationIcon = findViewById(R.id.notifications_icon);
        ImageView settingsIcon = findViewById(R.id.settings_icon);

        profileIcon.setOnClickListener(v -> startActivity(new Intent(this, MainActivity.class)));
        notificationIcon.setOnClickListener(v -> startActivity(new Intent(this, NotificationActivity.class)));
        settingsIcon.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));
    }

    private void fetchMessages() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String bodyNumber = sharedPreferences.getString("bodyNumber", null);

        if (bodyNumber == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            return;
        }

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
                .url(API_URL)
                .addHeader("body_number", bodyNumber)
                .build();

        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(okhttp3.Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(HomeActivity.this, "Failed to fetch messages", Toast.LENGTH_SHORT).show());
                Log.e("HomeActivity", "Error: " + e.getMessage());
            }

            @Override
            public void onResponse(okhttp3.Call call, okhttp3.Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray messages = jsonResponse.getJSONArray("messages");

                        StringBuilder messageText = new StringBuilder();
                        for (int i = 0; i < messages.length(); i++) {
                            JSONObject messageObj = messages.getJSONObject(i);
                            String content = messageObj.getString("message");
                            String timestamp = messageObj.getString("timestamp");
                            messageText.append("\uD83D\uDD14 ").append(content).append("\n⏰ ").append(timestamp).append("\n\n");
                        }

                        runOnUiThread(() -> messagesTextView.setText(messageText.toString()));

                    } catch (Exception e) {
                        Log.e("HomeActivity", "Error parsing JSON: " + e.getMessage());
                    }
                } else {
                    runOnUiThread(() -> Toast.makeText(HomeActivity.this, "Failed to load messages", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }

    private void fetchDeductMessages() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
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

        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(okhttp3.Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(HomeActivity.this, "Failed to fetch deduct messages", Toast.LENGTH_SHORT).show());
                Log.e("HomeActivity", "Error: " + e.getMessage());
            }

            @Override
            public void onResponse(okhttp3.Call call, okhttp3.Response response) throws IOException {
                if (!response.isSuccessful()) {
                    runOnUiThread(() -> Toast.makeText(HomeActivity.this, "Failed to load deduct messages", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }
}
