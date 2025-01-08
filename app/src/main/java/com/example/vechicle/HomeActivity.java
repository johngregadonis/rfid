package com.example.vechicle;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class HomeActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPrefs";  // SharedPreferences key
    private TextView balanceTextView;  // TextView to display the balance
    private SwipeRefreshLayout swipeRefreshLayout;  // Layout for swipe-to-refresh

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_home);

        // Initialize the balance TextView
        balanceTextView = findViewById(R.id.balanceTextView);

        // Initialize SwipeRefreshLayout
        swipeRefreshLayout = findViewById(R.id.swipe_refresh_layout);

        // Set up the swipe-to-refresh listener
        swipeRefreshLayout.setOnRefreshListener(() -> {
            // Refresh the balance
            refreshBalance();

            // Stop the refresh indicator
            swipeRefreshLayout.setRefreshing(false);
        });

        // Retrieve the balance and display it
        refreshBalance();

        // Find the profile icon and notification icon
        ImageView profileIcon = findViewById(R.id.profile_icon);
        ImageView notificationIcon = findViewById(R.id.notifications_icon);

        // Set OnClickListener for the profile icon
        profileIcon.setOnClickListener(v -> {
            // Navigate to MainActivity
            Intent intent = new Intent(HomeActivity.this, MainActivity.class);
            startActivity(intent);
        });

        // Set OnClickListener for the notification icon
        notificationIcon.setOnClickListener(v -> {
            // Navigate to NotificationActivity
            Intent intent = new Intent(HomeActivity.this, NotificationActivity.class);
            startActivity(intent);
        });
    }

    /**
     * Refresh the balance displayed in the TextView.
     */
    private void refreshBalance() {
        // Retrieve the balance from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String balance = sharedPreferences.getString("balance", "0.00");  // Default to "0.00" if not found

        // Update the balance TextView
        balanceTextView.setText(" " + balance);
    }
}
//old code