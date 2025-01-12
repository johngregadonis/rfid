package com.example.vechicle;

import android.util.Log;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

public class WebSocketManager {
    private WebSocket webSocket;

    public void connectWebSocket() {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url("ws://10.0.2.2:8080").build();  // For Emulator
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, okhttp3.Response response) {
                super.onOpen(webSocket, response);
                Log.d("WebSocket", "Connected to WebSocket server");
                // Optionally send a message after connection is opened
                sendMessage("Hello Server");
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                super.onMessage(webSocket, text);
                // Handle received message
                Log.d("WebSocket", "Received message: " + text);
            }

            @Override
            public void onMessage(WebSocket webSocket, ByteString bytes) {
                super.onMessage(webSocket, bytes);
                // Handle binary message if needed
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, okhttp3.Response response) {
                super.onFailure(webSocket, t, response);
                Log.e("WebSocket", "Error: " + t.getMessage());
            }

            @Override
            public void onClosing(WebSocket webSocket, int code, String reason) {
                super.onClosing(webSocket, code, reason);
                Log.d("WebSocket", "WebSocket is closing. Code: " + code + " Reason: " + reason);
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                super.onClosed(webSocket, code, reason);
                Log.d("WebSocket", "WebSocket closed. Code: " + code + " Reason: " + reason);
            }
        });
    }

    // Method to send a message (balance update) to the WebSocket server
    public void sendMessage(String message) {
        if (webSocket != null) {
            webSocket.send(message);
            Log.d("WebSocket", "Sent message: " + message);
        } else {
            Log.e("WebSocket", "WebSocket is not connected!");
        }
    }

    public void closeWebSocket() {
        if (webSocket != null) {
            webSocket.close(1000, "Closing WebSocket");
            Log.d("WebSocket", "WebSocket closed");
        }
    }
}
