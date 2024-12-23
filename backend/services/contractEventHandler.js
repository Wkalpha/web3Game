const { web3, contract } = require('./web3utlts.js');
const { pool } = require('../database/pool.js');
const { updateUserTimeCoin, getTimeCoin, deductTimeCoin } = require('../models/userModel.js');
const prizePoolModel = require('../models/prizePoolModel.js');
const { sendToPlayerMessage } = require('../services/webSocketService');

/**
 * 監聽 TokensPurchased 事件
 */
function handleTokensPurchased() {
  contract.events.TokensPurchased()
    .on('data', async (event) => {
      console.log(event); // 可以選擇不顯示

      const weiToEth = web3.utils.fromWei(event.returnValues.ethAmount, 'ether');
      const timeCoin = weiToEth * 10000; // 1 ETH = 10000 TimeCoin
      const buyer = event.returnValues.buyer;

      try {
        // 更新 UserInfo 的 TimeCoin
        await updateUserTimeCoin(timeCoin, buyer);

        // 更新 PrizePool 的 Amount
        await prizePoolModel.updateMainPrizePoolAmount(weiToEth);

        const userInfoTimeCoin = await getTimeCoin(buyer);

        // 只通知對應的買家 (特定的 walletAddress)
        const message = {
          event: 'TokensPurchased',
          data: {
            buyer,
            userTimeCoin: userInfoTimeCoin
          }
        };

        sendToPlayerMessage(buyer, message);

      } catch (err) {
        console.error('更新 UserInfo 或 PrizePool 失敗:', err);
      }
    });
}

/**
 * 監聽 EthTransferred 事件
 */
function handleEthTransferred() {
  contract.events.EthTransferred()
    .on('data', async (event) => {
      console.log(event); // 可以選擇不顯示

      let totalAmount = event.returnValues.amountAfterFee + event.returnValues.feeAmount;
      const weiToEth = web3.utils.fromWei(totalAmount, 'ether');
      const timeCoin = weiToEth * 10000; // 1 ETH = 10000 TimeCoin
      const buyer = event.returnValues.to;

      try {
        // 扣除玩家的 TimeCoin
        await deductTimeCoin(buyer, timeCoin);

        const userInfoTimeCoin = await getTimeCoin(buyer);

        // 只通知對應的買家 (特定的 walletAddress)
        const message = {
          event: 'TimeCoinToETH',
          data: {
            buyer,
            userTimeCoin: userInfoTimeCoin
          }
        };

        sendToPlayerMessage(buyer, message);

      } catch (err) {
        console.error('更新 UserInfo Time Coin 失敗:', err);
      }
    });
}

module.exports = {
  handleTokensPurchased,
  handleEthTransferred
};
