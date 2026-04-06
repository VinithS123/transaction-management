package com.finance.backend.transaction_management.mapper;

import com.finance.backend.transaction_management.entity.TransactionEntity;
import com.finance.backend.transaction_management.repository.CategorySummary;
import com.finance.backend.transaction_management.repository.MonthlyTrendHelper;
import com.finance.transaction_management.dto.CategoryExpenditure;
import com.finance.transaction_management.dto.MonthlyTrend;
import com.finance.transaction_management.dto.TransactionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TransactionEntity toTransactionEntity(TransactionDto transactionDto);

    TransactionDto toTransactionDto(TransactionEntity save);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDto(TransactionDto transactionDto, @MappingTarget TransactionEntity transactionEntity);

    List<TransactionDto> toTransactionDtoList(List<TransactionEntity> transactionEntityList);

    List<CategoryExpenditure> toCategoryExpenditureList(List<CategorySummary> categorySummaryList);

    MonthlyTrend toMonthlyTrend(MonthlyTrendHelper monthlyTrendHelper);
    List<MonthlyTrend> toMonthlyTrendList(List<MonthlyTrendHelper> monthlyTrendList);
}
