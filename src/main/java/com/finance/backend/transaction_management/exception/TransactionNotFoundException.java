package com.finance.backend.transaction_management.exception;

public class TransactionNotFoundException extends RuntimeException{
    String message;
    public TransactionNotFoundException(String message){
        super(message);
    }
}
