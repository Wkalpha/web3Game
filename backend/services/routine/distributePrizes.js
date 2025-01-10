const pool = require('../../database/pool');

const distributePrizes = async (yearWeek) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // 開啟交易

        console.log(`🔄 開始分配排行榜獎金（YearWeek=${yearWeek}）`);

        // 1️⃣ 查詢獎金池 (prizepool.id = 2)
        const [prizePool] = await connection.query(`
            SELECT FLOOR(Amount*10000) AS AdjustedAmount FROM prizepool WHERE id = 2;
        `);

        if (prizePool.length === 0) {
            throw new Error('無法找到排行榜獎金池');
        }

        const totalPrize = prizePool[0].AdjustedAmount;
        const topPrizePool = totalPrize * 0.8;
        const mainPrizePool = totalPrize * 0.2;

        // 2️⃣ 取出前三名 WalletAddress
        const [topPlayers] = await connection.query(`
            SELECT WalletAddress 
            FROM leaderboard 
            WHERE YearWeek = ? 
            ORDER BY Scores DESC 
            LIMIT 3;
        `, [yearWeek]);

        if (topPlayers.length < 3) {
            throw new Error('排行榜前三名不足，無法發放獎勵');
        }

        const [W1, W2, W3] = topPlayers.map(player => player.WalletAddress);

        console.log(`🏆 冠軍: ${W1}, 亞軍: ${W2}, 季軍: ${W3}`);
        console.log(`🎁 總獎金池: ${totalPrize}, 80% 分配: ${topPrizePool}, 20% 回注: ${mainPrizePool}`);

        // 3️⃣ 發放排行榜獎金
        const rewards = [
            { wallet: W1, amount: topPrizePool * 0.7 }, // 冠軍 70%
            { wallet: W2, amount: topPrizePool * 0.2 }, // 亞軍 20%
            { wallet: W3, amount: topPrizePool * 0.1 }  // 季軍 10%
        ];

        for (let { wallet, amount } of rewards) {
            console.log(`💰 發放 ${wallet}: ${amount}`);
            await connection.query(`
                UPDATE userinfo 
                SET TimeCoin = TimeCoin + ? 
                WHERE WalletAddress = ?;
            `, [amount, wallet]);

            // 記錄獎金發放
            await connection.query(`
                INSERT INTO rewardlog (WalletAddress, RewardAmount, RewardType, YearWeek)
                VALUES (?, ?, 'leaderboard', ?);
            `, [wallet, amount, yearWeek]);
        }

        console.log(`💰 從排行榜獎金池扣除已發放獎金: ${totalPrize}`);
        await connection.query(`
            UPDATE prizepool 
            SET Amount = 0
            WHERE id = 2;
        `, [totalPrize]);

        // 4️⃣ 將 20% 剩餘獎金注入主要獎金池 (prizepool.id = 1)
        console.log(`💰 注入主要獎金池: ${mainPrizePool}`);
        await connection.query(`
            UPDATE prizepool 
            SET Amount = Amount + (?/10000) 
            WHERE id = 1;
        `, [mainPrizePool]);

        // 5️⃣ 處理投票中獎者（猜中冠軍 W1）
        console.log(`🎟 開始計算投注者抽獎券`);

        const [winningBets] = await connection.query(`
            SELECT FromWalletAddress, BetAmount 
            FROM leaderboardBetRecord 
            WHERE ToWalletAddress = ? 
            AND YearWeek = ?;
        `, [W1, yearWeek]);

        console.log(winningBets)

        for (let bet of winningBets) {
            console.log(bet);
            const ticketCount = Math.ceil((bet.BetAmount / 1000) * 1.5);

            // 先查詢 UserInfo 取得 UserId
            const [userResult] = await connection.query(`
                SELECT Id FROM UserInfo WHERE WalletAddress = ?;
            `, [bet.FromWalletAddress]);

            if (userResult.length === 0) {
                console.warn(`⚠️ 找不到對應的 UserId，跳過錢包地址: ${bet.FromWalletAddress}`);
                continue; // 跳過這筆記錄
            }

            const userId = userResult[0].Id;

            console.log(`🎟 ${bet.FromWalletAddress} 投注 ${bet.BetAmount}，獲得 ${ticketCount} 張抽獎券`);

            // 記錄抽獎券 (ItemId 固定為 25)
            await connection.query(`
                INSERT INTO UserInventory (UserId, ItemId, Quantity, UpdatedAt)
                VALUES (?, 25, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                Quantity = Quantity + ?, UpdatedAt = CURRENT_TIMESTAMP;
            `, [userId, ticketCount, ticketCount]);
        }

        await connection.commit();
        console.log(`✅ 排行榜獎金與抽獎券發放完成！`);
    } catch (error) {
        console.error('❌ 發放排行榜獎金時發生錯誤:', error);
        await connection.rollback();
    } finally {
        connection.release();
    }
};

module.exports = distributePrizes;