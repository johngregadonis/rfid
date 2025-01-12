package com.example.vechicle;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.app.PendingIntent;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okhttp3.Response;

public class WebSocketService extends android.app.Service {

    private WebSocket webSocket;
    private static final String CHANNEL_ID = "WebSocketChannel";
    private static final String WEBSOCKET_URL = "ws://192.168.1.6:8080"; // Your WebSocket URL

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundService();
        startWebSocketConnection();
        scheduleWebSocketWorker();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (webSocket != null) {
            webSocket.close(1000, "Service Destroyed");
        }
    }

    private void startWebSocketConnection() {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(WEBSOCKET_URL).build();
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                super.onOpen(webSocket, response);
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                super.onMessage(webSocket, text);
                sendNotification(text);
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                super.onFailure(webSocket, t, response);
                sendNotification("WebSocket connection failed, retrying...");
                startWebSocketConnection();  // Retry connection
            }

            @Override
            public void onClosing(WebSocket webSocket, int code, String reason) {
                super.onClosing(webSocket, code, reason);
            }
        });
    }

    private void sendNotification(String message) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "WebSocket Notifications", NotificationManager.IMPORTANCE_DEFAULT);
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, NotificationActivity.class);
        intent.putExtra("message", message);  // Pass the message to NotificationActivity
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("WebSocket Message")
                .setContentText(message)
                .setSmallIcon(R.drawable.baseline_notifications_none_24)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build();

        notificationManager.notify(1, notification);
    }

    private void startForegroundService() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("WebSocket Running")
                .setContentText("The WebSocket service is running in the background.")
                .setSmallIcon(R.drawable.baseline_notifications_none_24)
                .build();

        startForeground(1, notification);
    }

    private void scheduleWebSocketWorker() {
        OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(WebSocketWorker.class).build();
        WorkManager.getInstance(this).enqueue(workRequest);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
//old