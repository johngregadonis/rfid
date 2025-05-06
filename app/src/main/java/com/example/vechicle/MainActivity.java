package com.example.vechicle;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
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

    private static final String BASE_URL = "http://192.168.1.8:3001/";
    private static final String PREFS_NAME = "UserPrefs";
    private static final String IMAGE_URI_KEY = "imageUri";
    private static final int PERMISSION_REQUEST_CODE = 1;

    private final ActivityResultLauncher<Intent> galleryLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    selectedImageUri = result.getData().getData();
                    if (selectedImageUri != null) {
                        getContentResolver().takePersistableUriPermission(selectedImageUri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        photoImageView.setImageURI(selectedImageUri);
                        saveImageUri(selectedImageUri.toString());
                        addPhotoText.setVisibility(TextView.INVISIBLE);
                    }
                }
            });

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

        // Request necessary permissions
        requestStoragePermission();

        // Load user details
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

        // Fetch operator details
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

        // Make add photo text clickable
        addPhotoText.setOnClickListener(v -> openGallery());

        // Change photo button click listener
        changePhotoButton.setOnClickListener(v -> openGallery());

        // Load saved photo
        loadSavedPhoto();
    }

    private void openGallery() {
        Intent galleryIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        galleryIntent.addCategory(Intent.CATEGORY_OPENABLE);
        galleryIntent.setType("image/*");
        galleryIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        galleryLauncher.launch(galleryIntent);
    }

    private void saveImageUri(String uri) {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(IMAGE_URI_KEY, uri);
        editor.apply();
    }

    private void loadSavedPhoto() {
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUri = sharedPreferences.getString(IMAGE_URI_KEY, null);
        if (savedUri != null) {
            try {
                selectedImageUri = Uri.parse(savedUri);
                photoImageView.setImageURI(selectedImageUri);
                addPhotoText.setVisibility(TextView.INVISIBLE);
            } catch (Exception e) {
                Log.e("ImageError", "Error loading saved image: " + e.getMessage());
                Toast.makeText(this, "Error loading saved image.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void requestStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_MEDIA_IMAGES}, PERMISSION_REQUEST_CODE);
            }
        } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) { // Android 9 and below
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
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
