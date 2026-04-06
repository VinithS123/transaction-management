package com.finance.backend.transaction_management.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.finance.backend.transaction_management.entity.UserPrincipal;


@Component
public class SecurityUtils {

    public long getUserId(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if((authentication!=null) && (authentication.getPrincipal() instanceof UserPrincipal user)){
            return user.getUserId();
        }

        throw new RuntimeException( "user not authenticated ");
    }
}
