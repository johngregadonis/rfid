package com.example.vechicle;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class MainActivity extends AppCompatActivity {

    private TextView nameText, barangayText, addressText, bodyNumberText;
    private ImageView photoImageView;
    private Button changePhotoButton;
    private TextView addPhotoText;
    private Uri selectedImageUri;

    private static final String BASE_URL = "http://192.168.1.9:3001/"; // Replace with your actual backend URL
    private static final String PREFS_NAME = "UserPrefs";
    private static final int REQUEST_GALLERY = 100;
    private static final int PERMISSION_REQUEST_CODE = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize views
        nameText = findViewById(R.id.nameRectangle);
        barangayText = findViewById(R.id.addressRectangle);
        addressText = findViewById(R.id.contactRectangle);
        bodyNumberText = findViewById(R.id.bodyNumberRectangle);
        photoImageView = findViewById(R.id.photoImageView);
        addPhotoText = findViewById(R.id.addPhotoText);
        changePhotoButton = findViewById(R.id.changePhotoButton);

        // Check and request storage permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQUEST_CODE);
        }

        // Load user details from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String bodyNumber = sharedPreferences.getString("bodyNumber", null);

        if (bodyNumber == null) {
            Toast.makeText(this, "No user logged in. Redirecting to login.", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        // Set up Retrofit
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        ApiService apiService = retrofit.create(ApiService.class);

        // Fetch operator details from PostgreSQL through the API
        apiService.getOperatorDetails(bodyNumber).enqueue(new Callback<Operator>() {
            @Override
            public void onResponse(Call<Operator> call, Response<Operator> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Operator operator = response.body();
                    nameText.setText(operator.getName());
                    barangayText.setText(operator.getBarangay());
                    addressText.setText(operator.getAddress());
                    bodyNumberText.setText(operator.getBodyNumber());
                } else {
                    Toast.makeText(MainActivity.this, "Error fetching details", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Operator> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });

        // Add photo text click listener
        addPhotoText.setOnClickListener(v -> openGallery());

        // Change photo button click listener
        changePhotoButton.setOnClickListener(v -> {
            if (selectedImageUri != null) {
                openGallery();
            } else {
                Toast.makeText(this, "Please add a photo first.", Toast.LENGTH_SHORT).show();
            }
        });

        // Load previously saved photo if exists
        loadSavedPhoto();
    }

    private void openGallery() {
        Intent galleryIntent = new Intent(Intent.ACTION_PICK, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        startActivityForResult(galleryIntent, REQUEST_GALLERY);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_GALLERY && resultCode == RESULT_OK && data != null) {
            selectedImageUri = data.getData();
            photoImageView.setImageURI(selectedImageUri);

            // Save photo URI to SharedPreferences
            SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString("imageUri", selectedImageUri.toString());
            editor.apply();
            addPhotoText.setVisibility(TextView.INVISIBLE); // Hide "Add Photo" text if photo is set
        }
    }

    private void loadSavedPhoto() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUri = sharedPreferences.getString("imageUri", null);
        if (savedUri != null) {
            try {
                selectedImageUri = Uri.parse(savedUri);
                if (selectedImageUri != null) {
                    photoImageView.setImageURI(selectedImageUri);
                    addPhotoText.setVisibility(TextView.INVISIBLE); // Hide "Add Photo" text if photo is set
                }
            } catch (Exception e) {
                Log.e("ImageError", "Error loading saved image: " + e.getMessage());
                Toast.makeText(this, "Error loading saved image.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    // Handle permission result for storage access
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Permission granted", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Permission denied. Cannot access gallery.", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
//old code