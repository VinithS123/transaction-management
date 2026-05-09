package com.finance.backend.transaction_management.controller;

import com.finance.backend.transaction_management.service.UserService;
import com.finance.transaction_management.api.AuthenticationApi;
import com.finance.transaction_management.dto.LoginRequest;
import com.finance.transaction_management.dto.LoginResponse;
import com.finance.transaction_management.dto.SignInRequest;
import com.finance.transaction_management.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController implements AuthenticationApi {

    final UserService userService;

    @Override
    public ResponseEntity<LoginResponse> loginUser(LoginRequest loginRequest) {
        return ResponseEntity.ok(userService.verifyUser(loginRequest));

    }

    @Override
    public ResponseEntity<UserResponse> registerUser(SignInRequest signInRequest) {
        return  ResponseEntity.ok(userService.registerUser(signInRequest));

    }
}

