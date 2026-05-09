package com.finance.backend.transaction_management.repository;

import com.finance.backend.transaction_management.entity.TransactionEntity;
import com.finance.transaction_management.dto.Category;
import com.finance.transaction_management.dto.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {

    boolean existsByUserIdAndId(long userId, long id);

    Optional<TransactionEntity> findByUserIdAndId(long userId, long id);

    @Query("SELECT SUM(t.amount) FROM TransactionEntity t WHERE t.userId = :userId AND t.type = 'INCOME'")
    Double getIncomeSum(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM TransactionEntity t WHERE t.userId = :userId AND t.type = 'EXPENSE'")
    Double getExpenseSum(@Param("userId") Long userId);

    @Query("SELECT t FROM TransactionEntity t " +
            "WHERE t.userId = :userId AND " +
            "(cast(:type as String) IS NULL OR t.type = :type) AND " +
            "(cast(:category as String) IS NULL OR t.category = :category) AND " +
            "(cast(:startDate as date) IS NULL OR t.recordDate >= :startDate) AND " +
            "(cast(:endDate as date) IS NULL OR t.recordDate <= :endDate)")
    Page<TransactionEntity> findWithFilters(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("category") Category category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT t FROM TransactionEntity t " +
            "WHERE t.userId = :userId AND " +
            "(cast(:keyword as String) IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(cast(:type as String) IS NULL OR t.type = :type) AND " +
            "(cast(:category as String) IS NULL OR t.category = :category) AND " +
            "(cast(:startDate as date) IS NULL OR t.recordDate >= :startDate) AND " +
            "(cast(:endDate as date) IS NULL OR t.recordDate <= :endDate)")
    Page<TransactionEntity> searchTransactionsWithFilters(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            @Param("type") TransactionType type,
            @Param("category") Category category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query(value = "SELECT * FROM transactions WHERE user_id = :userId ORDER BY record_date DESC LIMIT 5", nativeQuery = true)
    List<TransactionEntity> getRecentTransactionsExplicitQuery(@Param("userId") Long userId);


    @Query(value = "SELECT category AS category, SUM(amount) AS totalAmount " +
            "FROM transactions " +
            "WHERE user_id = :userId AND type = 'EXPENSE' " +
            "GROUP BY category",
            nativeQuery = true)
    List<CategorySummary> getCategoryExpenditure(@Param("userId") Long userId);

    @Query(value = """
    SELECT 
        CAST(EXTRACT(MONTH FROM record_date) AS INTEGER) AS month, 
        CAST(EXTRACT(YEAR FROM record_date) AS INTEGER) AS year, 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) AS profit
    FROM transactions
    WHERE user_id = :userId AND EXTRACT(YEAR FROM record_date) = :year
    GROUP BY month, year
    ORDER BY month ASC
    """, nativeQuery = true)
        List<MonthlyTrendHelper> getMonthlyTrends(@Param("userId") Long userId, @Param("year") int year);

}
