package com.finance.backend.transaction_management.repository;

import com.finance.transaction_management.dto.Category;

public interface CategorySummary {

    Category getCategory();
    Double getTotalAmount();

}