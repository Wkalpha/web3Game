const prizeItemPoolModel = require('../models/prizeItemPoolModel');

/**
 * 取得抽獎池
 */
const getPrizeItemPool = async (req, res) => {
  try {
    const prizeItemPool = await prizeItemPoolModel.queryPrizeItemPool();

    res.json({
      prizeItemPool
    });

  } catch (error) {
    res.status(500).json({ error: '取得抽獎池失敗', details: error.message });
  }
};

module.exports = {
  getPrizeItemPool
};
