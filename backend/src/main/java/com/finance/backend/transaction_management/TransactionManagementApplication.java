package com.finance.backend.transaction_management;

import io.jsonwebtoken.Jwts;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.crypto.SecretKey;
import java.util.Base64;

@SpringBootApplication
public class TransactionManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(TransactionManagementApplication.class, args);
		SecretKey key = Jwts.SIG.HS256.key().build();
		System.out.println(Base64.getEncoder().encodeToString(key.getEncoded()));
	}

}
