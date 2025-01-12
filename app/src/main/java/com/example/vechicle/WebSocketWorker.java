package com.example.vechicle;

import android.content.Context;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okhttp3.Response;

public class WebSocketWorker extends Worker {

    private static final String WEBSOCKET_URL = "ws://192.168.1.6:8080"; // Your WebSocket URL

    public WebSocketWorker(Context context, WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @Override
    public Result doWork() {
        startWebSocketConnection();
        return Result.success();
    }

    private void startWebSocketConnection() {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(WEBSOCKET_URL).build();
        client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                super.onOpen(webSocket, response);
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                super.onMessage(webSocket, text);
                // Send a local notification or handle the message in some other way
                sendNotification(text);
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                super.onFailure(webSocket, t, response);
                // Handle failure, retrying connection
            }
        });
    }

    private void sendNotification(String message) {
        // You can implement notification logic here, similar to what is in WebSocketService
    }
}
