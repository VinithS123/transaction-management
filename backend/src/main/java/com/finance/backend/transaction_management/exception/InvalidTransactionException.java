package com.finance.backend.transaction_management.exception;

public class InvalidTransactionException extends RuntimeException{
    String message;
    public InvalidTransactionException(String message){
        super(message);
    }
}
