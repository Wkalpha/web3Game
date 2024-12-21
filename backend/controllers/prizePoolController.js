const { getMainPrizePoolAmount, getLeaderboardPrizePoolAmount } = require('../models/prizePoolModel');

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
    res.status(500).json({ error: '取得主獎金池失敗', details: error.message });
  }
};

/**
 * 查詢排行榜獎金池
 */
const queryLeaderboardPrizePool = async (req, res) => {
  try {
    const amount = await getLeaderboardPrizePoolAmount();

    res.json({
      amount
    });
  } catch (error) {
    res.status(500).json({ error: '取得排行榜獎金池失敗', details: error.message });
  }
};

module.exports = {
  queryMainPrizePool,
  queryLeaderboardPrizePool
};
