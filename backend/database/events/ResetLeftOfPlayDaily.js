const pool = require('../pool');

const createResetLeftOfPlayDailyEvent = async () => {
    // 先檢查 ResetLeftOfPlayDaily 事件是否存在
    const [resetLeftOfPlayDaily] = await pool.query(`
        SELECT * 
        FROM INFORMATION_SCHEMA.EVENTS 
        WHERE EVENT_SCHEMA = ? 
          AND EVENT_NAME = 'ResetLeftOfPlayDaily';
    `, [process.env.DB_DATABASE]);

    if (resetLeftOfPlayDaily.length > 0) {
        console.log('事件 ResetLeftOfPlayDaily 已存在，正在刪除...');

        // 刪除已存在的 ResetLeftOfPlayDaily 事件
        const dropResetLeftOfPlayDailyEventSql = `DROP EVENT IF EXISTS ResetLeftOfPlayDaily;`;
        await pool.query(dropResetLeftOfPlayDailyEventSql);
        console.log('ResetLeftOfPlayDaily 事件已刪除');
    }

    console.log('正在建立新的 ResetLeftOfPlayDaily 事件...');

    // 創建新的 ResetLeftOfPlayDaily 事件
    const createResetLeftOfPlayDailyEventSql = `
        CREATE EVENT ResetLeftOfPlayDaily 
        ON SCHEDULE EVERY 1 DAY 
        STARTS CONVERT_TZ(CURRENT_DATE, @@global.time_zone, '+00:00') + INTERVAL '00:00' HOUR_MINUTE 
        DO 
        UPDATE UserInfo 
        SET LeftOfPlay = BaseLeftOfPlay  
        WHERE LeftOfPlay < BaseLeftOfPlay ;
    `;
    await pool.query(createResetLeftOfPlayDailyEventSql);
    console.log('ResetLeftOfPlayDaily 事件已建立');
};

module.exports = createResetLeftOfPlayDailyEvent;
