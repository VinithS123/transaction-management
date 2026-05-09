package com.finance.backend.transaction_management.controller;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.finance.backend.transaction_management.exception.TransactionNotFoundException;
import com.finance.transaction_management.dto.ExceptionResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleCustomerNotFoundException(TransactionNotFoundException exception, HttpServletRequest request){
        ExceptionResponse response = new ExceptionResponse()
                .timeStamp(LocalDateTime.now())
                        .message(exception.getMessage())
                                .details("Transaction not found")
                                        .path(request.getRequestURI());

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionResponse> handleException(Exception exception,HttpServletRequest request){
        ExceptionResponse response = new ExceptionResponse()
                .timeStamp(LocalDateTime.now())
                .message(exception.getMessage())
                .details("Internal Error Occurred")
                .path(request.getRequestURI());
        return ResponseEntity.internalServerError().body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ExceptionResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException exception, HttpServletRequest request){
        String message = "Invalid Json";
        if(exception.getCause() instanceof InvalidFormatException formatException){
            String fieldName = formatException.getPath().getFirst().getFieldName();
            Object invalidValue = formatException.getValue();
            message = String.format("Invalid value '%s provided for field '%s'",invalidValue,fieldName);
        }
        ExceptionResponse response = new ExceptionResponse()
                .timeStamp(LocalDateTime.now())
                .message(message)
                .details("Bad request")
                .path(request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
