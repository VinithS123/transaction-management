package com.finance.backend.transaction_management.service;

import com.finance.backend.transaction_management.entity.UserPrincipal;
import com.finance.backend.transaction_management.entity.UserEntity;
import com.finance.backend.transaction_management.mapper.UserMapper;
import com.finance.backend.transaction_management.repository.UsersRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyUserDetailService implements UserDetailsService {

    final UsersRepo usersRepo;

    final UserMapper userMapper;

//    final JwtService jwtService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity user =  usersRepo.findByUserName(username);

        if(user == null){
            throw new UsernameNotFoundException("UserName : "+username+" Not Found");
        }

        return new UserPrincipal(user);

    }

    public  UserDetails loadUserByUserId(long userId){
        UserEntity user = usersRepo.findByUserId(userId);

        if(user == null){
            throw new UsernameNotFoundException("UserID : "+userId+" Not Found");
        }
        return new UserPrincipal(user);
    }

    public UserEntity registerUser(UserEntity user) {
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder(12);
        user.setUserPassword(bCryptPasswordEncoder.encode(user.getUserPassword()));
        //Stored User
        return usersRepo.save(user);
    }
}

