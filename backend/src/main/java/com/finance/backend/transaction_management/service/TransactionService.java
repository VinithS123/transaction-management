package com.finance.backend.transaction_management.service;

import com.finance.backend.transaction_management.entity.TransactionEntity;
import com.finance.backend.transaction_management.exception.InvalidTransactionException;
import com.finance.backend.transaction_management.exception.TransactionNotFoundException;
import com.finance.backend.transaction_management.mapper.TransactionMapper;
import com.finance.backend.transaction_management.repository.TransactionRepository;
import com.finance.transaction_management.dto.Category;
import com.finance.transaction_management.dto.TransactionDto;
import com.finance.transaction_management.dto.TransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository repository;

    private final TransactionMapper transactionMapper;


    public TransactionDto addTransaction(TransactionDto transactionDto, long userId) {

        if(transactionDto.getRecordDate().isAfter(LocalDate.now())){
            throw new InvalidTransactionException("Invalid Date");
        }
        TransactionEntity record = transactionMapper.toTransactionEntity(transactionDto);
        record.setUserId(userId);
        return transactionMapper.toTransactionDto(repository.save(record));
    }

    public void deleteTransaction(long userId, long id) {
        if(!repository.existsByUserIdAndId(userId,id)){
            throw new TransactionNotFoundException("Transaction Not Found");
        }
        repository.deleteById(id);

    }

    public TransactionDto editTransaction(TransactionDto transactionDto, long userId, long id) {
        TransactionEntity record = repository.findByUserIdAndId(userId,id).orElseThrow(
                ()-> new TransactionNotFoundException("Transaction Not Found"));
        transactionMapper.updateEntityFromDto(transactionDto, record);
        return transactionMapper.toTransactionDto(repository.save(record));
    }

    public List<TransactionDto> getAllTransaction(Long userId, TransactionType type, Category category,
                                                  LocalDate startDate, LocalDate endDate,
                                                  String sortBy, String sortDir, Integer page, Integer size) {

        Sort sort = Sort.by(sortBy).descending();
        if(sortDir.equalsIgnoreCase("ASC")){
            sort = Sort.by(sortBy).ascending();
        }

        Pageable pageable = PageRequest.of(page,size,sort);
        List<TransactionEntity> TransactionList = repository.findWithFilters(userId,type,category,startDate,endDate,pageable).toList();
        return transactionMapper.toTransactionDtoList(TransactionList);
    }

    public TransactionDto getTransactionById(long userId, Long id) {
        TransactionEntity transaction = repository.findByUserIdAndId(userId,id).orElseThrow(
                ()-> new TransactionNotFoundException(""));
        return transactionMapper.toTransactionDto(transaction);
    }

    public List<TransactionDto> searchTransactions(
            long userId, String keyword, TransactionType type, Category category,
            LocalDate startDate, LocalDate endDate, String sortBy, String sortDir,
            Integer page, Integer size) {

        Sort sort = Sort.by(sortBy).descending();
        if(sortDir.equalsIgnoreCase("ASC")){
            sort = Sort.by(sortBy).ascending();
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TransactionEntity> transactions = repository.searchTransactionsWithFilters(
                userId, keyword, type, category, startDate, endDate, pageable);

        return transactionMapper.toTransactionDtoList(transactions.toList());
    }
}
