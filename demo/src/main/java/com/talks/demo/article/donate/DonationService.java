package com.talks.demo.article.donate;

import com.talks.demo.articleDao.dao.DonationOrderMapper;
import com.talks.demo.articleDao.pojo.DonationOrder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private final EcpayConfig ecpayConfig;
    private final DonationOrderMapper donationOrderMapper;

    @Transactional
    public String createEcpayOrder(Long articleId, Double amount) {
        if (amount == null || amount <= 0) {
            log.warn("payment_event=order_rejected provider=ecpay articleId={} reason=invalid_amount", articleId);
            throw new IllegalArgumentException("amount must be greater than 0");
        }

        String merchantTradeNo = genMerchantTradeNo();
        String tradeDesc = "donate";
        String itemName = "donate website";
        int totalAmount = amount.intValue();

        DonationOrder donationOrder = new DonationOrder();
        donationOrder.setMerchantTradeNo(merchantTradeNo);
        donationOrder.setArticleId(articleId);
        donationOrder.setAmount(BigDecimal.valueOf(totalAmount));
        donationOrder.setStatus("PENDING");
        donationOrderMapper.insert(donationOrder);
        log.info("payment_event=order_created provider=ecpay merchantTradeNo={} articleId={} amount={} status=PENDING",
                merchantTradeNo, articleId, donationOrder.getAmount());

        Map<String, String> params = new HashMap<>();
        params.put("MerchantID", ecpayConfig.getMerchantId());
        params.put("MerchantTradeNo", merchantTradeNo);
        params.put("MerchantTradeDate", java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss")));
        params.put("PaymentType", "aio");
        params.put("TotalAmount", String.valueOf(totalAmount));
        params.put("TradeDesc", tradeDesc);
        params.put("ItemName", itemName);
        params.put("ReturnURL", ecpayConfig.getReturnUrl());
        params.put("ChoosePayment", "ALL");
        params.put("ClientBackURL", ecpayConfig.getClientBackUrl());
        params.put("EncryptType", "1");
        Map<String, String> macParams = new HashMap<>(params);

        // 產生 CheckMacValue（原文）
        String checkMacValue = EcpayUtil.generateCheckMacValue(macParams, ecpayConfig.getHashKey(), ecpayConfig.getHashIv(), 1);
        params.put("CheckMacValue", checkMacValue);


        // 生成自動送出表單 HTML
        return EcpayUtil.genAutoSubmitForm(params, ecpayConfig.getBaseUrl());
    }

    @Transactional
    public int markPaidSuccess(String merchantTradeNo, String ecpayTradeNo, String rtnCode, String rtnMsg) {
        DonationOrder existingOrder = donationOrderMapper.findByMerchantTradeNo(merchantTradeNo);
        if (existingOrder == null) {
            log.error("payment_event=callback_order_not_found provider=ecpay merchantTradeNo={}", merchantTradeNo);
            throw new IllegalStateException("Donation order not found. merchantTradeNo=" + merchantTradeNo);
        }
        if ("SUCCESS".equals(existingOrder.getStatus())) {
            log.info("payment_event=callback_duplicate provider=ecpay merchantTradeNo={} status=SUCCESS",
                    merchantTradeNo);
            return 0;
        }

        int updatedRows = donationOrderMapper.markPaidSuccess(merchantTradeNo, ecpayTradeNo, rtnCode, rtnMsg);
        if (updatedRows == 0) {
            DonationOrder latestOrder = donationOrderMapper.findByMerchantTradeNo(merchantTradeNo);
            if (latestOrder != null && "SUCCESS".equals(latestOrder.getStatus())) {
                log.info("payment_event=callback_duplicate provider=ecpay merchantTradeNo={} status=SUCCESS reason=concurrent_request",
                        merchantTradeNo);
                return 0;
            }
            log.error("payment_event=payment_update_failed provider=ecpay merchantTradeNo={} rtnCode={}",
                    merchantTradeNo, rtnCode);
            throw new IllegalStateException("Failed to mark donation order as paid. merchantTradeNo=" + merchantTradeNo);
        }
        log.info("payment_event=payment_succeeded provider=ecpay merchantTradeNo={} ecpayTradeNo={} amount={} articleId={} updatedRows={}",
                merchantTradeNo, ecpayTradeNo, existingOrder.getAmount(), existingOrder.getArticleId(), updatedRows);
        return updatedRows;
    }

    // 產生不重複的訂單編號（英數、<=20）
    private static String genMerchantTradeNo() {
        String ts = String.valueOf(System.currentTimeMillis()); // 毫秒時間戳
        String rnd = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 3).toUpperCase(); // 3碼隨機
        String no = "EC" + ts + rnd; // 前綴避免純數字
        return no.length() > 20 ? no.substring(0, 20) : no; // 維持在20字內
    }
}
