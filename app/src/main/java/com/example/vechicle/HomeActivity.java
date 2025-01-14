package com.example.vechicle;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class HomeActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPrefs"; // SharedPreferences key
    private TextView nameTextView, balanceTextView; // TextViews for name and balance
    private ImageView photoImageView; // ImageView for profile photo
    private SwipeRefreshLayout swipeRefreshLayout; // Layout for swipe-to-refresh

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

        // Load user details
        loadUserDetails();

        // Set up swipe-to-refresh listener
        swipeRefreshLayout.setOnRefreshListener(() -> {
            loadUserDetails();
            swipeRefreshLayout.setRefreshing(false); // Stop the refresh indicator
        });

        // Set up click listeners for icons
        setupIconListeners();
    }

    /**
     * Load user details (name, balance, and photo) from SharedPreferences and fetch balance from API.
     */
    private void loadUserDetails() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        // Fetch user details from SharedPreferences
        String name = sharedPreferences.getString("name", "Guest"); // Default to "Guest" if not found
        String bodyNumber = sharedPreferences.getString("bodyNumber", null); // Retrieve body number
        String photoUri = sharedPreferences.getString("imageUri", null); // Default to null if not found

        // Update name
        nameTextView.setText(name);

        // Update photo
        if (photoUri != null) {
            try {
                Uri uri = Uri.parse(photoUri);
                photoImageView.setImageURI(uri);
            } catch (Exception e) {
                Toast.makeText(this, "Error loading photo", Toast.LENGTH_SHORT).show();
            }
        }

        // Fetch balance if body number is available
        if (bodyNumber != null) {
            fetchBalance(bodyNumber); // Fetch balance from the API
        } else {
            balanceTextView.setText("Error: Body number not found");
        }
    }

    /**
     * Fetch balance from the API using Retrofit.
     */
    private void fetchBalance(String bodyNumber) {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://192.168.1.7:3001/") // Use your server's IP or localhost
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        ApiService apiService = retrofit.create(ApiService.class);
        Call<Operator> call = apiService.getOperatorDetails(bodyNumber);

        call.enqueue(new Callback<Operator>() {
            @Override
            public void onResponse(Call<Operator> call, Response<Operator> response) {
                if (response.isSuccessful() && response.body() != null) {
                    String balance = response.body().getBalance(); // Get balance as String
                    balanceTextView.setText("₱" + balance + " "); // Display balance as String
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

    /**
     * Set up click listeners for the profile and notification icons.
     */
    private void setupIconListeners() {
        ImageView profileIcon = findViewById(R.id.profile_icon);
        ImageView notificationIcon = findViewById(R.id.notifications_icon);
        ImageView settingsIcon = findViewById(R.id.settings_icon); // Settings icon

        // Navigate to MainActivity when profile icon is clicked
        profileIcon.setOnClickListener(v -> {
            Intent intent = new Intent(HomeActivity.this, MainActivity.class);
            startActivity(intent);
        });

        // Navigate to NotificationActivity when notification icon is clicked
        notificationIcon.setOnClickListener(v -> {
            Intent intent = new Intent(HomeActivity.this, NotificationActivity.class);
            startActivity(intent);
        });
        // Navigate to SettingsActivity when settings icon is clicked
        settingsIcon.setOnClickListener(v -> {
            Intent intent = new Intent(HomeActivity.this, SettingsActivity.class); // Replace with your Settings activity
            startActivity(intent);
        });

    }
}
//old