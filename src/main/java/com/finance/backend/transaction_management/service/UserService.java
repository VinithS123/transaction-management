package com.finance.backend.transaction_management.service;

import com.finance.backend.transaction_management.entity.UserEntity;
import com.finance.backend.transaction_management.mapper.UserMapper;
import com.finance.backend.transaction_management.repository.UsersRepo;
import com.finance.transaction_management.dto.LoginRequest;
import com.finance.transaction_management.dto.LoginResponse;
import com.finance.transaction_management.dto.SignInRequest;
import com.finance.transaction_management.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    final MyUserDetailService myUserDetailService;
    final AuthenticationManager authenticationManager;
    final JwtService jwtService;
    final UsersRepo usersRepo;
    final UserMapper userMapper;

    public UserResponse registerUser(SignInRequest signInRequest) {
        UserEntity userEntity = userMapper.toUserEntity(signInRequest);
        return userMapper.toUserResponse(myUserDetailService.registerUser(userEntity));
    }

    public LoginResponse verifyUser(LoginRequest loginRequest) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUserName(),
                        loginRequest.getUserPassword()));


        UserEntity realUser = usersRepo.findByUserName(loginRequest.getUserName());

        realUser.setActiveAt(LocalDateTime.now());
        usersRepo.save(realUser);
        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(jwtService.generateToken(realUser));

        return loginResponse;
    }


    public long findIdByUsername(UserEntity userEntity) {
        return usersRepo.findByUserName(userEntity.getUserName()).getUserId();
    }
}

