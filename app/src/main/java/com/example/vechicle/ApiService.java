package com.example.vechicle;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.Query;
import retrofit2.http.Path;

public interface ApiService {
    @GET("operatorDetails")
    Call<Operator> getOperatorDetails(@Query("bodyNumber") String bodyNumber);


    @POST("/login")
    Call<LoginResponse> loginUser(@Body User user);

    Call<MessageResponse> getMessages(@Path("vehicleOperatorId") int vehicleOperatorId);

}
//old