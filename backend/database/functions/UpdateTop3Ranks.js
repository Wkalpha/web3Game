const pool = require('../pool');

const createUpdateTop3RanksFunction = async () => {
    const [updateTop3RanksFunction] = await pool.query(`
        SELECT * 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? 
          AND ROUTINE_NAME = 'UpdateTop3Ranks'
          AND ROUTINE_TYPE = 'FUNCTION';
      `, [process.env.DB_DATABASE]);

    if (updateTop3RanksFunction.length === 0) {
        console.log('函數 UpdateTop3Ranks 不存在，正在建立...');
        const functionSql = `
        CREATE FUNCTION UpdateTop3Ranks(inputYearWeek VARCHAR(10))
            RETURNS INT
            DETERMINISTIC
            BEGIN
                -- 變量聲明
                DECLARE yearWeekRank INT DEFAULT 1;
                DECLARE done INT DEFAULT 0;
                DECLARE current_wallet_address VARCHAR(255);
                
                -- 定義游標，用於獲取前三名的 WalletAddress
                DECLARE leaderboard_cursor CURSOR FOR 
                SELECT WalletAddress 
                FROM Leaderboard 
                WHERE YearWeek = inputYearWeek 
                ORDER BY Scores DESC 
                LIMIT 3;
                
                -- 定義處理游標結束的條件
                DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
                
                -- 開啟游標
                OPEN leaderboard_cursor;
                
                leaderboard_loop: LOOP
                    -- 提取一行數據
                    FETCH leaderboard_cursor INTO current_wallet_address;
                    
                    -- 如果已經到達數據集的末尾，則退出循環
                    IF done THEN
                        LEAVE leaderboard_loop;
                    END IF;
                    
                    -- 更新當前的 WalletAddress 的 YearWeekRank
                    UPDATE Leaderboard 
                    SET YearWeekRank = yearWeekRank 
                    WHERE WalletAddress = current_wallet_address 
                      AND YearWeek = inputYearWeek;
                    
                    -- 增加排名計數器
                    SET yearWeekRank = yearWeekRank + 1;
                END LOOP;
                
                -- 關閉游標
                CLOSE leaderboard_cursor;
                
                -- 返回0作為成功標誌
                RETURN 0;
            END;
      `;
        await pool.query(functionSql);
        console.log('UpdateTop3Ranks 函數已確保存在');
    } else {
        console.log('UpdateTop3Ranks 函數已存在，無須建立')
    }
};

module.exports = createUpdateTop3RanksFunction;