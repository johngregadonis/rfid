package com.example.vechicle;


import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {

    // Base URL of your API
    private static final String BASE_URL = "https://192.168.1.8.com/"; // Replace with your API base URL

    private static Retrofit retrofit;

    // Get Retrofit instance
    public static Retrofit getRetrofitInstance() {
        if (retrofit == null) {
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create()) // Gson converter for API response
                    .build();
        }
        return retrofit;
    }

    // Get the API service
    public static ApiService getApiService() {
        return getRetrofitInstance().create(ApiService.class);
    }
}

