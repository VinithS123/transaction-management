package com.finance.backend.transaction_management.service;

import com.finance.backend.transaction_management.entity.TransactionEntity;
import com.finance.backend.transaction_management.mapper.TransactionMapper;
import com.finance.backend.transaction_management.repository.TransactionRepository;
import com.finance.transaction_management.dto.DashboardSummaryDto;
import com.finance.transaction_management.dto.TransactionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;

    private final TransactionMapper transactionMapper;

    public DashboardSummaryDto getDashboardSummary(Long companyId) {

        Double incomeSum = transactionRepository.getIncomeSum(companyId);
        Double expenseSum = transactionRepository.getExpenseSum(companyId);

        double income = incomeSum != null ? incomeSum : 0.0;
        double expenses = expenseSum != null ? expenseSum : 0.0;
        double netBalance = income - expenses;

        return new DashboardSummaryDto()
                .totalIncome(income)
                        .totalExpenses(expenses)
                .netBalance(netBalance);
    }

    public List<TransactionDto> getRecentTransactions(Long userId) {

        List<TransactionEntity> recentEntities = transactionRepository.getRecentTransactionsExplicitQuery(userId);
        return transactionMapper.toTransactionDtoList(recentEntities);
    }
}
