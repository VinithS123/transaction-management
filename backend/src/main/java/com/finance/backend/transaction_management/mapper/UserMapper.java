package com.finance.backend.transaction_management.mapper;

import com.finance.backend.transaction_management.entity.UserEntity;
import com.finance.transaction_management.dto.LoginRequest;
import com.finance.transaction_management.dto.SignInRequest;
import com.finance.transaction_management.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper{

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "activeAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    UserEntity toUserEntity(SignInRequest signInRequest);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "activeAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    UserEntity toUserEntity(LoginRequest loginRequest);

    SignInRequest toSignInRequest(UserEntity userEntity);

    UserResponse toUserResponse(UserEntity userEntity);

}
