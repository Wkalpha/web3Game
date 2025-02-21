const reserveModel = require('../models/reserveModel');

/**
 * 預約
 */
const reserve = async (req, res) => {
    try {
        const { userInfo } = req.body;

        const result = await reserveModel.insert(userInfo);

        if (!result.success) {
            // 代表是重複
            return res.status(400).json({
                success: false,
                message: '您已預約，請耐心等候'
            });
        }

        // 成功
        return res.json({
            success: true,
            total: result.totalRows
        });

    } catch (error) {
        res.status(500).json({ error: '預約失敗', details: error.message });
    }
};

/**
 * 查詢預約人數
 */
const reserveCount = async (req, res) => {
    const totalRows = await reserveModel.queryReserveCount();
    return res.json({
        total: totalRows
    });
}

module.exports = {
    reserve,
    reserveCount
};
