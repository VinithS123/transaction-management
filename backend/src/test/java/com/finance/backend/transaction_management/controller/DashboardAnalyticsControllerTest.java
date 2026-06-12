package com.finance.backend.transaction_management.controller;

import com.finance.backend.transaction_management.config.SecurityUtils;
import com.finance.backend.transaction_management.service.DashboardAnalyticsService;
import com.finance.transaction_management.dto.Category;
import com.finance.transaction_management.dto.CategoryExpenditure;
import org.checkerframework.checker.units.qual.C;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardAnalyticsControllerTest {

    @Mock
    DashboardAnalyticsService analyticsService;

    @Mock
    SecurityUtils securityUtils;

    @InjectMocks
    DashboardAnalyticsController analyticsController;

    @BeforeEach
    void setup(){

    }

    @Test
    void getCategoryExpenditureSuccess() {

        List<CategoryExpenditure> categoryExpenditure = new ArrayList<>();
        when(securityUtils.getUserId()).thenReturn(100L);
        when(analyticsService.getCategoryExpenditure(100L)).thenReturn(categoryExpenditure);

        ResponseEntity<List<CategoryExpenditure>> response = analyticsController.getCategoryExpenditure();

        assertEquals(HttpStatus.OK,response.getStatusCode());
        assertEquals(categoryExpenditure,response.getBody());

//        verify(securityUtils, times(1)).getUserId();
//        verify(analyticsService,times(1)).getCategoryExpenditure(100L);

    }

    @Test
    void getMonthlyTrendsSuccess() {
    }

    @Test
    void getCategoryExpenditureFailure() {

    }

    @Test
    void getMonthlyTrendsFailure() {
    }
}