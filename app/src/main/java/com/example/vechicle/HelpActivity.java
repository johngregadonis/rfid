package com.example.vechicle;

import android.os.Bundle;
import android.widget.ExpandableListView;
import androidx.appcompat.app.AppCompatActivity;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class HelpActivity extends AppCompatActivity {

    private ExpandableListView helpListView;
    private HelpAdapter helpAdapter;
    private List<String> helpTopics;
    private HashMap<String, List<String>> helpDetails;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.help_activity);

        helpListView = findViewById(R.id.helpExpandableList);
        prepareHelpData();

        helpAdapter = new HelpAdapter(this, helpTopics, helpDetails);
        helpListView.setAdapter(helpAdapter);
    }

    private void prepareHelpData() {
        helpTopics = new ArrayList<>();
        helpDetails = new HashMap<>();

        // Add Help Topics
        helpTopics.add("RFID Missed");
        helpTopics.add("Forgot Password");
        helpTopics.add("Change Password");
        helpTopics.add("How to Use the App");
        helpTopics.add("Contact Support");

        // Add Help Content
        List<String> rfidHelp = new ArrayList<>();
        rfidHelp.add("If your RFID tag is lost, report immediately to the terminal operator for detailed instructions on how to retrieve or replace your RFID.");

        List<String> forgotPasswordHelp = new ArrayList<>();
        forgotPasswordHelp.add("If you forgot your password, go to the login screen and click on 'Forgot Password'. Enter your registered email, and follow the instructions sent to your email.");

        List<String> changePasswordHelp = new ArrayList<>();
        changePasswordHelp.add("To change your password, log in to your account, go to 'Settings' > 'Change Password', enter your current password and the new password, then confirm.");

        List<String> usageHelp = new ArrayList<>();
        usageHelp.add("Navigate through the app using the menu. Tap on a category to view details.");

        List<String> contactSupportHelp = new ArrayList<>();
        contactSupportHelp.add("For further assistance, contact our support team via email at Smart.transit@gmail.com, contact number 09532169800 or visit our office.");

        // Assign Help Details
        helpDetails.put(helpTopics.get(0), rfidHelp);
        helpDetails.put(helpTopics.get(1), forgotPasswordHelp);
        helpDetails.put(helpTopics.get(2), changePasswordHelp);
        helpDetails.put(helpTopics.get(3), usageHelp);
        helpDetails.put(helpTopics.get(4), contactSupportHelp);
    }
}
