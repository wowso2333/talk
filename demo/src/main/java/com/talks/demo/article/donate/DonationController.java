package com.talks.demo.article.donate;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/donate")
@RequiredArgsConstructor
@Slf4j
public class DonationController {

    private final DonationService donationService;
    private final EcpayConfig ecpayConfig;

    @PostMapping("/create")
    public ResponseEntity<String> createDonation(@RequestParam(required = false) Long articleId, @RequestParam Double amount) {
        String formHtml = donationService.createEcpayOrder(articleId, amount);
        return ResponseEntity.ok(formHtml); // 前端收到直接渲染 HTML 跳付款頁
    }

    @PostMapping("/ecpay-callback")
    public ResponseEntity<String> handleEcpayCallback(HttpServletRequest request) {
        // 先把參數取出成 Map
        Map<String, String[]> parameterMap = request.getParameterMap();
        Map<String, String> params = new HashMap<>();
        parameterMap.forEach((key, values) -> params.put(key, values[0]));
        log.info("payment_event=callback_received provider=ecpay merchantTradeNo={} ecpayTradeNo={} rtnCode={}",
                params.get("MerchantTradeNo"), params.get("TradeNo"), params.get("RtnCode"));

        // 驗證簽章
        boolean isValid = new EcpayUtil().verifyCheckMacValue(params, ecpayConfig.getHashKey(), ecpayConfig.getHashIv());

        if (!isValid) {
            // 驗證失敗
            log.warn("payment_event=callback_signature_invalid provider=ecpay merchantTradeNo={}",
                    params.get("MerchantTradeNo"));
            return ResponseEntity.badRequest().body("0|CheckMacValue Error");
        }

        String merchantTradeNo = params.get("MerchantTradeNo");
        String rtnCode = params.get("RtnCode");

        // ✅ 驗證 rtnCode == 1 表示付款成功
        if ("1".equals(rtnCode)) {
            int updatedRows = donationService.markPaidSuccess(
                    merchantTradeNo,
                    params.get("TradeNo"),
                    rtnCode,
                    params.get("RtnMsg")
            );
            log.debug("payment_event=callback_acknowledged provider=ecpay merchantTradeNo={} updatedRows={}",
                    merchantTradeNo, updatedRows);
        } else {
            log.warn("payment_event=payment_not_succeeded provider=ecpay merchantTradeNo={} ecpayTradeNo={} rtnCode={} rtnMsg={}",
                    merchantTradeNo, params.get("TradeNo"), rtnCode, sanitizeLogValue(params.get("RtnMsg")));
        }

        return ResponseEntity.ok("1|OK");
    }

    private static String sanitizeLogValue(String value) {
        if (value == null) {
            return null;
        }
        return value.replace('\n', '_').replace('\r', '_');
    }

}
