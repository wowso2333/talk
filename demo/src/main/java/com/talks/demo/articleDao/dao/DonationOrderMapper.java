package com.talks.demo.articleDao.dao;

import com.talks.demo.articleDao.pojo.DonationOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DonationOrderMapper {
    int insert(DonationOrder donationOrder);

    int markPaidSuccess(@Param("merchantTradeNo") String merchantTradeNo,
                        @Param("ecpayTradeNo") String ecpayTradeNo,
                        @Param("rtnCode") String rtnCode,
                        @Param("rtnMsg") String rtnMsg);

    DonationOrder findById(@Param("id") Long id);

    DonationOrder findByMerchantTradeNo(@Param("merchantTradeNo") String merchantTradeNo);
}
