package com.finance.backend.transaction_management.service;

import com.finance.backend.transaction_management.mapper.TransactionMapper;
import com.finance.backend.transaction_management.repository.CategorySummary;
import com.finance.backend.transaction_management.repository.MonthlyTrendHelper;
import com.finance.backend.transaction_management.repository.TransactionRepository;
import com.finance.transaction_management.dto.CategoryExpenditure;
import com.finance.transaction_management.dto.MonthlyTrend;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardAnalyticsService {

    private final TransactionRepository repository;

    private final TransactionMapper transactionMapper;
    public List<CategoryExpenditure> getCategoryExpenditure(long userId) {

        List<CategorySummary> summaryList = repository.getCategoryExpenditure(userId);
        return transactionMapper.toCategoryExpenditureList(summaryList);
    }

    public List<MonthlyTrend> getMonthlyTrends(long userId) {
        int currentYear = java.time.LocalDate.now().getYear();
        List<MonthlyTrendHelper> monthlyTrendList = repository.getMonthlyTrends(userId, currentYear);
        return transactionMapper.toMonthlyTrendList(monthlyTrendList);
    }
}
