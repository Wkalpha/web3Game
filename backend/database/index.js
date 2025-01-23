const mysql = require('mysql2/promise');

// @ts-ignore
const createUserInfoTable = require('./tables/UserInfo');
const { createPrizePoolTable, insertInitialPrizePoolData } = require('./tables/PrizePool');
const createLeaderboardTable = require('./tables/Leaderboard');
const createLeaderboardBetRecordTable = require('./tables/LeaderboardBetRecord');
const createPrizeItemPoolTable = require('./tables/PrizeItemPool');
const createPrizeItemTable = require('./tables/PrizeItem');
const createUserDrawLogTable = require('./tables/UserDrawLog');
const createUserDrawCounterTable = require('./tables/UserDrawCounter');
const createUserInventoryTable = require('./tables/UserInventory');
const createGameInfoTable = require('./tables/GameInfo');
const createGameLogTable = require('./tables/GameLog');
const createGameLevel = require('./tables/GameLevel');
const createRewardLogTable = require('./tables/RewardLog');
const createBadgeDetailTable = require('./tables/BadgeDetail');
const createUserBadgeTable = require('./tables/UserBadge');
const createBadgeTransferLogTable = require('./tables/BadgeTransferLog');
const createDailyQuestsTable = require('./tables/DailyQuests');
const createUserDailyProgressTable = require('./tables/UserDailyProgress');
const createReferralsTable = require('./tables/Referrals');


// 環境變數
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'mysqladmin';
const DB_PASSWORD = process.env.DB_PASSWORD || 'mysqlpassword';
const DB_NAME = process.env.DB_NAME || 'mysqldb';

async function initializeDatabase() {
    try {
        // 1️⃣ 連接 MySQL（不指定資料庫）
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD
        });

        console.log('✅ MySQL 連接成功，開始檢查資料庫...');

        // 2️⃣ 檢查並建立資料庫（UTF-8 繁體中文）
        await connection.query(`
            CREATE DATABASE IF NOT EXISTS ${DB_NAME} 
            DEFAULT CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci;
        `);
        console.log(`✅ 資料庫 '${DB_NAME}' 檢查完成`);

        // 3️⃣ 重新連接，這次使用 `timebattle` 資料庫
        const db = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        console.log('✅ 重新連接到資料庫，準備建立資料表...');

        // 4️⃣ 建立所有資料表與事件
        await createUserInfoTable();
        await createPrizePoolTable();
        await insertInitialPrizePoolData();
        await createLeaderboardTable();
        await createLeaderboardBetRecordTable();
        await createPrizeItemPoolTable();
        await createPrizeItemTable();
        await createUserDrawLogTable();
        await createUserDrawCounterTable();
        await createUserInventoryTable();
        await createGameInfoTable();
        await createGameLogTable();
        await createGameLevel();
        await createRewardLogTable();
        await createBadgeDetailTable();
        await createUserBadgeTable();
        await createBadgeTransferLogTable();
        await createDailyQuestsTable();
        await createUserDailyProgressTable();
        await createReferralsTable();

        console.log('🎉 所有表、函數、事件初始化完成');
        
        // 關閉連線
        await db.end();
    } catch (err) {
        console.error('❌ 初始化失敗：', err);
    }
}

// 執行初始化
initializeDatabase();