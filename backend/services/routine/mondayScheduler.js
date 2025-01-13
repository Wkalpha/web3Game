const cron = require('node-cron');
const updateTop3Ranks = require('./updateLeaderboard');
const distributePrizes = require('./distributePrizes');

// 設定排程：每週一凌晨 00:00 更新排行榜
cron.schedule('0 0 * * 1', async () => {
// cron.schedule('*/5 * * * * *', async () => {
    // 取得當前週數（例如 202502）
    const now = new Date();
    const yearWeek = now.getFullYear() + String(Math.ceil((now.getDate() - now.getDay() + 7) / 7)).padStart(2, '0');

    console.log(`🔄 排程執行：開始更新排行榜（YearWeek=${yearWeek}）...`);

    await updateTop3Ranks(yearWeek); // 更新排行榜
    await distributePrizes(yearWeek); // 發放獎金與抽獎券

    console.log(`✅ 排程執行完成（YearWeek=${yearWeek}）`);
}, {
    scheduled: true,
    timezone: "Asia/Taipei" // 設定時區，確保在台灣時間執行
});

console.log('🕒 排程已啟動，每週一 00:00 自動更新當週排行榜');

// cron.schedule('*/5 * * * * *', async () => {
//     console.log('🔄 測試模式：開始更新排行榜...');
//     await updateTop3Ranks('202502');
//     console.log('✅ 測試模式：排行榜更新完成');
// }, {
//     scheduled: true,
//     timezone: "Asia/Taipei" // 設定時區，確保在台灣時間執行
// });

// console.log('🕒 測試模式啟動，每 5 秒更新一次排行榜');
