package com.finance.backend.transaction_management.config;

import com.finance.backend.transaction_management.service.JwtService;
import com.finance.backend.transaction_management.service.MyUserDetailService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ApplicationContext context;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        long userId = 0;
        String role = null;
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);

            }

            if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                userId = jwtService.extractUserId(token);

                role = jwtService.extractRole(token);

                UserDetails userDetails = context.getBean(MyUserDetailService.class).loadUserByUserId(userId);

                if (jwtService.validateToken(token, userDetails)) {

                    List<SimpleGrantedAuthority> authorities =
                            java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(role));

                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }
        }catch (Exception e){
            System.out.println(e.getMessage());
        }
        filterChain.doFilter(request,response);
    }
}
