package com.example.vechicle;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okhttp3.Response;
import android.util.Log;
import android.app.NotificationManager;
import androidx.core.app.NotificationCompat;
import android.content.Context;
import android.app.Notification;
import android.widget.TextView;

public class WebSocketClient {

    private WebSocket webSocket;
    private Context context;
    private TextView messageTextView;

    // Constructor that accepts context and TextView for displaying message
    public WebSocketClient(Context context, TextView messageTextView) {
        this.context = context;
        this.messageTextView = messageTextView;
    }

    public void startWebSocket() {
        OkHttpClient client = new OkHttpClient();

        Request request = new Request.Builder()
                .url("ws://192.168.1.6:8080") // Update with your WebSocket server URL
                .build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                super.onOpen(webSocket, response);
                Log.d("WebSocket", "Connected");
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                super.onMessage(webSocket, text);
                Log.d("WebSocket", "Received message: " + text);
                // Handle the message here: Show it as a notification and update the UI
                sendNotification(text);
                updateMessageTextView(text);  // Update the TextView with the message
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                super.onFailure(webSocket, t, response);
                Log.e("WebSocket", "Error: " + t.getMessage());
            }
        });
    }

    public void stopWebSocket() {
        if (webSocket != null) {
            webSocket.close(1000, "Closing WebSocket");
        }
    }

    private void sendNotification(String message) {
        // Here, you can send the message as a notification to your NotificationActivity
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        Notification notification = new NotificationCompat.Builder(context, "channel_id")
                .setContentTitle("Balance Update")
                .setContentText(message)
                .setSmallIcon(R.drawable.baseline_notifications_none_24)
                .build();

        notificationManager.notify(1, notification);
    }

    private void updateMessageTextView(String message) {
        if (messageTextView != null) {
            // Update the TextView with the received message
            messageTextView.setText(message);
        }
    }
}
//old