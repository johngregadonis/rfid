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
     * Load user details (name, balance, and photo) from SharedPreferences.
     */
    private void loadUserDetails() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        // Fetch user details from SharedPreferences
        String name = sharedPreferences.getString("name", "Guest"); // Default to "Guest" if not found
        String balance = sharedPreferences.getString("balance", "0.00"); // Default to "0.00" if not found
        String photoUri = sharedPreferences.getString("imageUri", null); // Default to null if not found

        // Update name
        nameTextView.setText(name);

        // Update balance
        balanceTextView.setText("Balance: " + balance);

        // Update photo
        if (photoUri != null) {
            try {
                Uri uri = Uri.parse(photoUri);
                photoImageView.setImageURI(uri);
            } catch (Exception e) {
                Toast.makeText(this, "Error loading photo", Toast.LENGTH_SHORT).show();
            }
        }
    }

    /**
     * Set up click listeners for the profile and notification icons.
     */
    private void setupIconListeners() {
        ImageView profileIcon = findViewById(R.id.profile_icon);
        ImageView notificationIcon = findViewById(R.id.notifications_icon);

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
    }
}
