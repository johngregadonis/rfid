package com.example.vechicle;

import android.content.Context;

import okhttp3.OkHttpClient;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {
    private static Retrofit retrofit;

    public static Retrofit getInstance(Context context) {
        if (retrofit == null) {
            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(new AuthInterceptor(context))  // Add the AuthInterceptor here
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl("http://192.168.1.8:3001") // Your server URL
                    .client(client)  // Use the OkHttpClient with the interceptor
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }
}
