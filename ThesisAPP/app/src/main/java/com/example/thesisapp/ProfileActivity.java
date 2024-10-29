package com.example.thesisapp;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class ProfileActivity extends AppCompatActivity {

    private static final int PICK_IMAGE = 100;
    private ImageView photoImageView;
    private TextView addPhotoText;
    private Button changePhotoButton;
    private Uri selectedImageUri; // Variable to store the selected image URI

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.profile); // Ensure this matches your layout file name

        addPhotoText = findViewById(R.id.addPhotoText);
        photoImageView = findViewById(R.id.photoImageView);
        changePhotoButton = findViewById(R.id.changePhotoButton);

        // Retrieve the stored image URI when the activity is created
        String savedUri = getSharedPreferences("MyPrefs", Context.MODE_PRIVATE)
                .getString("imageUri", null);
        if (savedUri != null) {
            selectedImageUri = Uri.parse(savedUri); // Convert string back to URI
            photoImageView.setImageURI(selectedImageUri); // Set the saved image to ImageView
            addPhotoText.setVisibility(TextView.INVISIBLE); // Make the Add Photo text invisible
        }

        addPhotoText.setOnClickListener(v -> {
            // Open the gallery to select an image for adding a new photo
            Intent galleryIntent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
            startActivityForResult(galleryIntent, PICK_IMAGE);
        });

        changePhotoButton.setOnClickListener(v -> {
            // Open the gallery to select an image for changing the existing photo
            if (selectedImageUri != null) {
                Intent galleryIntent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
                startActivityForResult(galleryIntent, PICK_IMAGE);
            } else {
                // Optionally, show a message that no photo has been added yet
                Toast.makeText(this, "Please add a photo first.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_IMAGE && resultCode == Activity.RESULT_OK && data != null) {
            selectedImageUri = data.getData(); // Store the selected image URI
            photoImageView.setImageURI(selectedImageUri); // Set the selected image to ImageView
            addPhotoText.setVisibility(TextView.INVISIBLE); // Make the Add Photo text invisible

            // Save the image URI in shared preferences
            getSharedPreferences("MyPrefs", Context.MODE_PRIVATE).edit()
                    .putString("imageUri", selectedImageUri.toString()) // Save as string
                    .apply();
        }
    }
}
