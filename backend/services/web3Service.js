const { transferEthToSpecificAddress, withdraw, web3, contract } = require('../web3utlts.js');

const transferToAddress = async (walletAddress, balanceChange) => {
  try {
    await transferEthToSpecificAddress(walletAddress, balanceChange);
    console.log(`ETH 轉移成功: ${balanceChange} ETH 到 ${walletAddress}`);
  } catch (error) {
    console.error('ETH 轉移失敗: ', error);
  }
};

module.exports = {
  transferToAddress
};
