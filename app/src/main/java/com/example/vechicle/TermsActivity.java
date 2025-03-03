package com.example.vechicle;

import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class TermsActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_terms_and_privacy);

        TextView tvTerms = findViewById(R.id.tv_terms);
        tvTerms.setText("Terms of Service and Privacy Policy\n\n"

                + "Welcome to Smart Transit! By using our application, you agree to the following Terms of Service and Privacy Policy.\n\n"
                + "1. Acceptance of Terms\n"
                + "By accessing or using Smart Transit, you agree to comply with these terms.\n\n"
                + "2. User Responsibilities\n"
                + "- You must be at least a owner/driver of the vehicle.\n"
                + "- You agree not to misuse the app.\n\n"
                + "3. Information We Collect\n"
                + "- Personal Information (e.g., Name, Email, body number)\n"
                + "- Usage Data and Device Information\n\n"
                + "4. How We Use Your Information\n"
                + "- To provide and improve our services.\n"
                + "- To communicate with you.\n\n"
                + "5. Data Security\n"
                + "We do not sell your data and protect it with security measures.\n\n"
                + "6. Changes and Contact\n"
                + "We may update this policy and notify you of changes.");
    }
}
