const pool = require('../pool');

const createUpdateLeaderboardWeeklyEvent = async () => {
    // 先檢查 UpdateLeaderboardWeekly 事件是否存在
    const [updateLeaderboardEvent] = await pool.query(`
        SELECT * 
        FROM INFORMATION_SCHEMA.EVENTS 
        WHERE EVENT_SCHEMA = ? 
          AND EVENT_NAME = 'UpdateLeaderboardWeekly';
      `, [process.env.DB_DATABASE]);

    if (updateLeaderboardEvent.length > 0) {
        console.log('事件 UpdateLeaderboardWeekly 已存在，正在刪除...');

        // 刪除已存在的 UpdateLeaderboardWeekly 事件
        const dropUpdateLeaderboardEventSql = `DROP EVENT IF EXISTS UpdateLeaderboardWeekly;`;
        await pool.query(dropUpdateLeaderboardEventSql);
        console.log('UpdateLeaderboardWeekly 事件已刪除');
    }

    console.log('正在建立新的 UpdateLeaderboardWeekly 事件...');

    // 創建新的 UpdateLeaderboardWeekly 事件
    const createUpdateLeaderboardEventSql = `
        CREATE EVENT UpdateLeaderboardWeekly 
        ON SCHEDULE EVERY 1 WEEK 
        STARTS CONVERT_TZ(CURRENT_DATE, @@global.time_zone, '+00:00') + INTERVAL '00:00' HOUR_MINUTE 
        DO 
        BEGIN
            SET @currentYearWeek = DATE_FORMAT(NOW(), '%x%v');
            CALL UpdateTop3Ranks(@currentYearWeek);
        END;
    `;
    await pool.query(createUpdateLeaderboardEventSql);
    console.log('UpdateLeaderboardWeekly 事件已建立');
};

module.exports = createUpdateLeaderboardWeeklyEvent;
