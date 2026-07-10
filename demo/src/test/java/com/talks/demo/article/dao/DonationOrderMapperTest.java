package com.talks.demo.article.dao;

import com.talks.demo.articleDao.dao.DonationOrderMapper;
import com.talks.demo.articleDao.pojo.DonationOrder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@MybatisTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Rollback(false)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3307/talks?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Taipei",
        "spring.datasource.username=root",
        "spring.datasource.password=123456",
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "mybatis.mapper-locations=classpath:dao/*.xml",
        "mybatis.type-aliases-package=com.talks.demo.articleDao.pojo",
        "mybatis.configuration.map-underscore-to-camel-case=true"
})
class DonationOrderMapperTest {
    private static final long TEST_USER_ID = 990001L;
    private static final long TEST_BOARD_ID = 990001L;
    private static final long TEST_ARTICLE_ID = 990001L;

    @Autowired
    private DonationOrderMapper donationOrderMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUpArticle() {
        jdbcTemplate.update("""
                INSERT IGNORE INTO user (id, username, password, role, enabled, avatar)
                VALUES (?, ?, ?, ?, ?, ?)
                """, TEST_USER_ID, "donation_mapper_test_user", "password", "ROLE_USER", true, "");

        jdbcTemplate.update("""
                INSERT IGNORE INTO boards (id, board_name, img_url, slogan, recommend)
                VALUES (?, ?, ?, ?, ?)
                """, TEST_BOARD_ID, "donation_mapper_test_board", "", "", false);

        jdbcTemplate.update("""
                INSERT IGNORE INTO article (article_id, title, board, board_id, user_id, content)
                VALUES (?, ?, ?, ?, ?, ?)
                """, TEST_ARTICLE_ID, "donation mapper test article", "donation_mapper_test_board",
                TEST_BOARD_ID, TEST_USER_ID, "content");
    }

    @Test
    void insertAndFindByMerchantTradeNo() {
        DonationOrder order = new DonationOrder();
        order.setMerchantTradeNo("TEST" + System.currentTimeMillis());
        order.setArticleId(TEST_ARTICLE_ID);
        order.setAmount(new BigDecimal("100.00"));
        order.setStatus("PENDING");

        int insertedRows = donationOrderMapper.insert(order);

        DonationOrder savedOrder = donationOrderMapper.findByMerchantTradeNo(order.getMerchantTradeNo());

        assertThat(insertedRows).isEqualTo(1);
        assertThat(order.getId()).isNotNull();
        assertThat(savedOrder).isNotNull();
        assertThat(savedOrder.getId()).isEqualTo(order.getId());
        assertThat(savedOrder.getArticleId()).isEqualTo(TEST_ARTICLE_ID);
        assertThat(savedOrder.getAmount()).isEqualByComparingTo("100.00");
        assertThat(savedOrder.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void markPaidSuccessUpdatesOrderStatus() {
        DonationOrder order = new DonationOrder();
        order.setMerchantTradeNo("TEST" + System.currentTimeMillis());
        order.setArticleId(TEST_ARTICLE_ID);
        order.setAmount(new BigDecimal("200.00"));
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
