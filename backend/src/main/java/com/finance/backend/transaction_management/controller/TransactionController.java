package com.finance.backend.transaction_management.controller;

import com.finance.backend.transaction_management.config.SecurityUtils;
import com.finance.backend.transaction_management.service.TransactionService;
import com.finance.transaction_management.api.TransactionsApi;
import com.finance.transaction_management.dto.Category;
import com.finance.transaction_management.dto.TransactionDto;
import com.finance.transaction_management.dto.TransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class TransactionController implements TransactionsApi{

    private final SecurityUtils securityUtils;

    private final TransactionService transactionService;

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<TransactionDto> addTransaction(TransactionDto transactionDto) {
        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(transactionService.addTransaction(transactionDto,userId));
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteTransaction(Long id) {
        long userId = securityUtils.getUserId();
        transactionService.deleteTransaction(userId,id);
        return ResponseEntity.noContent().build();
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<TransactionDto> editTransaction(Long id, TransactionDto transactionDto) {
        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(transactionService.editTransaction(transactionDto,userId,id));
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<TransactionDto>> getAllTransactions(TransactionType type, Category category,
                                                                   LocalDate startDate, LocalDate endDate,
                                                                   String sortBy, String sortDir, Integer page, Integer size) {

        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(transactionService.getAllTransaction(userId,type,category,startDate,endDate,sortBy,sortDir,page,size));

    }


    @Override
    @PreAuthorize("hasAnyAuthority('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<TransactionDto> getTransactionById(Long id) {
        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(transactionService.getTransactionById(userId,id));
    }

    @Override
    @PreAuthorize("hasAnyAuthority('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<List<TransactionDto>> searchTransactions(String keyword, TransactionType type,
                                                                   Category category, LocalDate startDate,
                                                                   LocalDate endDate, String sortBy,
                                                                   String sortDir, Integer page, Integer size) {
        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(transactionService.searchTransactions(
                userId,keyword,type,category,startDate,endDate,sortBy,sortDir,page,size));
    }
}
