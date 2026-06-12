package com.finance.backend.transaction_management.controller;

import com.finance.backend.transaction_management.config.SecurityUtils;
import com.finance.backend.transaction_management.service.DashboardService;
import com.finance.transaction_management.api.DashboardApi;
import com.finance.transaction_management.dto.DashboardSummaryDto;
import com.finance.transaction_management.dto.TransactionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DashboardController implements DashboardApi {

    private final SecurityUtils securityUtils;

    private final DashboardService dashboardService;

    @Override
    @PreAuthorize("hasAnyAuthority('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {

        Long companyId = securityUtils.getCompanyId();
        DashboardSummaryDto summaryDto = dashboardService.getDashboardSummary(companyId);
        return ResponseEntity.ok(summaryDto);

    }

    @Override
    @PreAuthorize("hasAnyAuthority('VIEWER', 'ANALYST', 'ADMIN')")
    public ResponseEntity<List<TransactionDto>> getRecentTransactions() {
        Long userId = securityUtils.getUserId();
        return ResponseEntity.ok(dashboardService.getRecentTransactions(userId));
    }

}
