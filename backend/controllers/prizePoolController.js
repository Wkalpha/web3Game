const { getMainPrizePoolAmount } = require('../models/prizePoolModel');

/**
 * 查詢主獎金池
 */
const queryMainPrizePool = async (req, res) => {
  try {
    const amount = await getMainPrizePoolAmount();

    res.json({
      amount
    });
  } catch (error) {
    res.status(500).json({ error: '更新用戶餘額失敗', details: error.message });
  }
};

module.exports = {
  queryMainPrizePool
};
