package com.finance.backend.transaction_management.service;

import com.finance.backend.transaction_management.entity.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import static javax.crypto.KeyGenerator.getInstance;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    public SecretKey getKey(){
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);

        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserEntity userEntity) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("userId", userEntity.getUserId());

        claims.put("role", userEntity.getRole().name());

        return Jwts.builder()
                .claims()
                .add(claims)
                .subject(userEntity.getUserName())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis()+ 600000 ))
                .and()
                .signWith(getKey())
                .compact();

    }

    public long extractUserId(String token) {

        long userId = extractAllClaims(token).get("userId", Number.class).longValue();
        return userId;
    }

    public String extractRole(String token) {
        String role = extractAllClaims(token).get("role", String.class);
        return role;
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private <T> T extractClaims(String token, Function<Claims,T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaims(token,Claims::getExpiration);
    }
}

