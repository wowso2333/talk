package com.talks.demo.article.cloud;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${r2.access-key-id}")
    private String accessKey;

    @Value("${r2.secret-access-key}")
    private String secretKey;

    @Value("${r2.region}")
    private String region;

    @Value("${r2.endpoint}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        // Cloudflare R2 相容 AWS S3 SDK v2，憑證從環境變數注入，避免寫死金鑰。
        AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKey, secretKey);

        // R2 需指定 endpointOverride，region 使用 auto，並建議使用 path-style。
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                .forcePathStyle(true)
                .build();
    }
}
