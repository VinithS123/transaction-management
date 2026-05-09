package com.finance.backend.transaction_management.repository;

import com.finance.backend.transaction_management.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsersRepo extends JpaRepository<UserEntity,Integer> {

    public UserEntity findByUserName(String userName);

    public UserEntity findByUserId(long userId);

}