const updateTop3Ranks = require('./updateLeaderboard');

updateTop3Ranks('202502').then(() => {
    console.log('更新完成');
    process.exit();
}).catch(err => {
    console.error('發生錯誤:', err);
    process.exit(1);
});