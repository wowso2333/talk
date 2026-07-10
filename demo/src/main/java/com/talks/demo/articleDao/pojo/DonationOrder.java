package com.talks.demo.articleDao.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DonationOrder {
    private Long id;
    private String merchantTradeNo;
    private Long articleId;
    private BigDecimal amount;
    private String status;
    private String ecpayTradeNo;
    private String rtnCode;
    private String rtnMsg;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime updatedAt;
}
