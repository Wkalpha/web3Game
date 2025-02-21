const clickTraceLogModel = require('../models/clickTraceLogModel');

/**
 * 紀錄點擊事件
 */
const click = async (req, res) => {
    const { action } = req.body;
    try {
        await clickTraceLogModel.insert(action);
        res.json();
    } catch (error) {
        res.status(500).json({ error: '追蹤點擊失敗' });
    }
}

module.exports = {
    click,
};
