package com.finance.backend.transaction_management.controller;

import com.finance.backend.transaction_management.config.SecurityUtils;
import com.finance.backend.transaction_management.service.DashboardAnalyticsService;
import com.finance.transaction_management.api.DashboardAnalyticsApi;
import com.finance.transaction_management.dto.CategoryExpenditure;
import com.finance.transaction_management.dto.MonthlyTrend;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DashboardAnalyticsController implements DashboardAnalyticsApi {

    private final DashboardAnalyticsService dashboardService;

    private final SecurityUtils securityUtils;

    @Override
    @PreAuthorize("hasAnyAuthority('ANALYST', 'ADMIN')")
    public ResponseEntity<List<CategoryExpenditure>> getCategoryExpenditure() {
        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(dashboardService.getCategoryExpenditure(userId));
    }

    @Override
    @PreAuthorize("hasAnyAuthority('ANALYST', 'ADMIN')")
    public ResponseEntity<List<MonthlyTrend>> getMonthlyTrends() {
        long userId = securityUtils.getUserId();
        return ResponseEntity.ok(dashboardService.getMonthlyTrends(userId));
    }
}
