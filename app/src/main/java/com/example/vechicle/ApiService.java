package com.example.vechicle;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.Query;
import retrofit2.http.Path;
import retrofit2.http.Header;
import okhttp3.ResponseBody;
import retrofit2.http.POST;
import java.util.List;



public interface ApiService {
    @GET("operatorDetails")
    Call<Operator> getOperatorDetails(@Query("bodyNumber") String bodyNumber);


    @POST("/login")
    Call<LoginResponse> loginUser(@Body User user);

    Call<MessageResponse> getMessages(@Path("vehicleOperatorId") int vehicleOperatorId);

    Call<List<DeductMessage>> getDeductMessages(@Query("vehicleOperatorId") int vehicleOperatorId);

    @POST("logout-all")
    Call<ResponseBody> logoutAllDevices(@Header("Authorization") String token);

    // Add the checkTokenValidity method
    @GET("/check-token-validity")
    Call<ResponseBody> checkTokenValidity(@Header("Authorization") String token);

}


//old