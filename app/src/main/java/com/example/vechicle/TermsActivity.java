package com.example.vechicle;

import android.os.Bundle;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.method.LinkMovementMethod;
import android.text.style.ClickableSpan;
import android.view.View;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class TermsActivity extends AppCompatActivity {
    private TextView tvTerms;
    private boolean[] isContentVisible = new boolean[7]; // Updated for 7 sections

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_terms_and_privacy);

        tvTerms = findViewById(R.id.tv_terms);
        tvTerms.setTextColor(getResources().getColor(android.R.color.white)); // Set text color to white

        // Initialize all visibility states as false (content hidden)
        for (int i = 0; i < isContentVisible.length; i++) {
            isContentVisible[i] = false;
        }

        updateTermsText(); // Set initial clickable text
    }

    private void updateTermsText() {
        StringBuilder fullText = new StringBuilder("Terms of Service and Privacy Policy\n\n"
                + "Welcome to Smart Transit! By using our application, you agree to the following Terms of Service and Privacy Policy.\n\n");

        // Section headers and their corresponding content
        String[] sectionTitles = {
                "1. Acceptance of Terms",
                "2. User Responsibilities",
                "3. Information We Collect",
                "4. How We Use Your Information",
                "5. Data Security",
                "6. Changes and Contact",
                "7. Delete Account" // New section
        };

        String[] sectionContents = {
                "\nBy accessing or using Smart Transit, you agree to comply with these terms.\n",
                "\n- You must be at least an owner/driver of the vehicle.\n- You agree not to misuse the app.\n",
                "\n- Personal Information (e.g., Name, Email, body number)\n- Usage Data and Device Information\n",
                "\n- To provide and improve our services.\n- To communicate with you.\n",
                "\nWe do not sell your data and protect it with security measures.\n",
                "\nWe may update this policy and notify you of changes.\n",
                "\nYou can request account deletion by contacting our support team.\n"
                        + "If your account has been deleted, all your information will be permanently removed.\n" // Updated content
        };

        int[] startIndexes = new int[sectionTitles.length]; // Store start index of each title

        for (int i = 0; i < sectionTitles.length; i++) {
            startIndexes[i] = fullText.length(); // Mark the start position
            fullText.append(sectionTitles[i]); // Add section title
            if (isContentVisible[i]) {
                fullText.append(sectionContents[i]); // Append content if visible
            }
            fullText.append("\n\n");
        }

        SpannableString spannableString = new SpannableString(fullText.toString());

        // Apply clickable spans to section titles
        for (int i = 0; i < sectionTitles.length; i++) {
            final int index = i;
            ClickableSpan clickableSpan = new ClickableSpan() {
                @Override
                public void onClick(View widget) {
                    isContentVisible[index] = !isContentVisible[index]; // Toggle visibility
                    updateTermsText(); // Refresh text
                }
            };

            spannableString.setSpan(clickableSpan, startIndexes[i], startIndexes[i] + sectionTitles[i].length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        tvTerms.setText(spannableString);
        tvTerms.setMovementMethod(LinkMovementMethod.getInstance()); // Enable clicking
    }
}
