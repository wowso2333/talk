package com.talks.demo.article.donate;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ecpay")
@Data
public class EcpayConfig {
    private String merchantId;
    private String hashKey;
    private String hashIv;
    private String baseUrl;
    private String returnUrl;
    private String clientBackUrl;
}
