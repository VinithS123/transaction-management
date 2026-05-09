package com.finance.backend.transaction_management.entity;

import com.finance.transaction_management.dto.RoleEnum;
import com.finance.transaction_management.dto.StatusEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long userId;

    @NotBlank(message = "Username cannot be empty")
    @Column(nullable = false)
    private String userName;

    @NotBlank(message = "Email is required")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Password is required")
    @Column( nullable = false)
    private String userPassword;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleEnum role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusEnum status;

    private LocalDateTime activeAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

}
