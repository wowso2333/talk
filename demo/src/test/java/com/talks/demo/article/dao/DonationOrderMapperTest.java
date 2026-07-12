package com.talks.demo.article.dao;

import com.talks.demo.articleDao.dao.DonationOrderMapper;
import com.talks.demo.articleDao.pojo.DonationOrder;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.annotation.Rollback;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Rollback(false)
class DonationOrderMapperTest {
    @Autowired
    private DonationOrderMapper donationOrderMapper;

    @Test
    void insertAndFindByMerchantTradeNo() {
        DonationOrder order = new DonationOrder();
        order.setMerchantTradeNo("TEST" + System.currentTimeMillis());
        order.setAmount(new BigDecimal("100.00"));
        order.setStatus("PENDING");

        int insertedRows = donationOrderMapper.insert(order);

        DonationOrder savedOrder = donationOrderMapper.findByMerchantTradeNo(order.getMerchantTradeNo());

        assertThat(insertedRows).isEqualTo(1);
        assertThat(order.getId()).isNotNull();
        assertThat(savedOrder).isNotNull();
        assertThat(savedOrder.getId()).isEqualTo(order.getId());
        assertThat(savedOrder.getArticleId()).isNull();
        assertThat(savedOrder.getAmount()).isEqualByComparingTo("100.00");
        assertThat(savedOrder.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void markPaidSuccessUpdatesOrderStatus() {
        DonationOrder order = new DonationOrder();
        order.setMerchantTradeNo("TEST" + System.currentTimeMillis());
        order.setAmount(new BigDecimal("150.00"));
        order.setStatus("PENDING");
        donationOrderMapper.insert(order);

        int updatedRows = donationOrderMapper.markPaidSuccess(
                order.getMerchantTradeNo(),
                "ECPAY123456",
                "1",
                "Succeeded"
        );

        DonationOrder savedOrder = donationOrderMapper.findById(order.getId());

        assertThat(updatedRows).isEqualTo(1);
        assertThat(savedOrder.getStatus()).isEqualTo("SUCCESS");
        assertThat(savedOrder.getEcpayTradeNo()).isEqualTo("ECPAY123456");
        assertThat(savedOrder.getRtnCode()).isEqualTo("1");
        assertThat(savedOrder.getRtnMsg()).isEqualTo("Succeeded");
        assertThat(savedOrder.getPaidAt()).isNotNull();
    }
}
