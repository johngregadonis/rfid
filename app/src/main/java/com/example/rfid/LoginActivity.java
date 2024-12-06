package com.example.rfid;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class LoginActivity extends AppCompatActivity {

    private EditText bodyNumberInput;
    private EditText passwordInput;
    private Button loginButton;
    private DatabaseReference databaseReference;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Initialize Firebase
        FirebaseDatabase firebaseDatabase = FirebaseDatabase.getInstance();
        Log.d("Firebase", "Firebase Database Initialized: " + (firebaseDatabase != null));
        databaseReference = firebaseDatabase.getReference("vehicleOperators");

        bodyNumberInput = findViewById(R.id.bodyNumber);
        passwordInput = findViewById(R.id.password);
        loginButton = findViewById(R.id.login_button);

        // Set up button click listener
        loginButton.setOnClickListener(v -> {
            Log.d("LoginActivity", "Login Button Clicked");
            verifyLogin();
        });
    }

    private void verifyLogin() {
        String bodyNumber = bodyNumberInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();

        // Check if fields are empty
        if (bodyNumber.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        // Log input values for debugging
        Log.d("LoginActivity", "Attempting to log in with Body Number: " + bodyNumber);

        // Query Firebase for the given bodyNumber
        databaseReference.orderByChild("bodyNumber").equalTo(bodyNumber)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override

                    public void onDataChange(@NonNull DataSnapshot snapshot) {
                        Log.d("LoginActivity", "Snapshot exists: " + snapshot.exists());
                        if (snapshot.exists()) {
                            // Log the keys to verify you're iterating over the correct data
                            for (DataSnapshot childSnapshot : snapshot.getChildren()) {
                                Log.d("LoginActivity", "Key: " + childSnapshot.getKey());
                                String storedPassword = childSnapshot.child("password").getValue(String.class);
                                Log.d("LoginActivity", "Stored password: " + storedPassword);

                                if (storedPassword != null && storedPassword.equals(password)) {
                                    Toast.makeText(LoginActivity.this, "Login successful!", Toast.LENGTH_SHORT).show();
                                    // Redirect to MainActivity
                                    startActivity(new Intent(LoginActivity.this, MainActivity.class));
                                    finish();
                                    return;
                                } else {
                                    Toast.makeText(LoginActivity.this, "Incorrect password", Toast.LENGTH_SHORT).show();
                                }
                            }
                        } else {
                            Toast.makeText(LoginActivity.this, "Body Number not found", Toast.LENGTH_SHORT).show();
                        }
                    }


                    @Override
                    public void onCancelled(@NonNull DatabaseError error) {
                        Log.e("LoginActivity", "Database error: " + error.getMessage());
                        Toast.makeText(LoginActivity.this, "Database error: " + error.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });
    }
}

