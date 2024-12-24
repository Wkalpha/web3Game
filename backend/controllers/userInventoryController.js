const userInventoryModel = require('../models/userInventoryModel');

/**
 * 查詢 UserInventory
 */
const getUserInventory = async (req, res) => {
  const { walletAddress } = req.body;
  try {
    const inventory = await userInventoryModel.queryUserInventory(walletAddress);
    
    res.json({
      inventory
    });
  } catch (error) {
    res.status(500).json({ error: '取得道具失敗', details: error.message });
  }
};

module.exports = {
  getUserInventory
};
