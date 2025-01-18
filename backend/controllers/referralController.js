const userModel = require('../models/userModel');
const referralModel = require('../models/referralModel');
const webSocketService = require('../services/webSocketService');

/**
 * 推薦功能
 */
const referral = async (req, res) => {
  try {
    const { keyInWalletAddress, provierWalletAddress } = req.body;

    // 驗證推薦人與被推薦人地址是否有效
    if (!keyInWalletAddress || !provierWalletAddress) {
      return res.status(400).json({ error: '推薦人或被推薦人地址無效' });
    }

    if (keyInWalletAddress === provierWalletAddress) {
      return res.status(400).json({ error: '推薦人與被推薦人不能相同' });
    }

    // 檢查被推薦人是否已經被推薦過
    const userInfo = await userModel.getUser(keyInWalletAddress);

    if (!userInfo) {
      return res.status(404).json({ error: '被推薦人地址不存在' });
    }

    if (userInfo.ReferredBy) {
      return res.status(400).json({ error: '該用戶已經被推薦過，無法再次推薦' });
    }

    // 檢查推薦人是否存在
    const referrer = await userModel.getUser(provierWalletAddress);

    if (!referrer) {
      return res.status(404).json({ error: '推薦人地址不存在' });
    }

    // 被推薦人資料>更新推薦人欄位、餘額
    await referralModel.updateReferee(keyInWalletAddress, provierWalletAddress, 1000);

    // 推薦人資料>更新餘額
    await userModel.updateUserTimeCoin(1000, provierWalletAddress);

    // 插入 log
    await referralModel.insertReferral(keyInWalletAddress, provierWalletAddress, 1000);

    // 重查 推薦人
    const providerTimeCoin = await userModel.getTimeCoin(provierWalletAddress);

    // 重查 被推薦人
    const keyInTimeCoin = await userModel.getTimeCoin(keyInWalletAddress);

    // webSocket
    const toProvierMessage = {
      event: 'TimeCoinChange',
      data: {
        walletAddress: provierWalletAddress,
        userTimeCoin: providerTimeCoin
      }
    };

    const toKeyInMessage = {
      event: 'TimeCoinChange',
      data: {
        walletAddress: keyInWalletAddress,
        userTimeCoin: keyInTimeCoin
      }
    };

    webSocketService.sendToPlayerMessage(provierWalletAddress, toProvierMessage);
    webSocketService.sendToPlayerMessage(keyInWalletAddress, toKeyInMessage);

    res.json({ message: '推薦成功，獎勵已發放' });

  } catch (error) {
    res.status(500).json({ error: '領取推薦人獎勵失敗', details: error.message });
  }
};

module.exports = {
  referral
};
