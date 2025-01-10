const distributePrizes = require('./distributePrizes');

const yearWeek = '202502'; // 手動設定 YearWeek

distributePrizes(yearWeek).then(() => {
    console.log(`✅ ${yearWeek} 獎勵發放完成`);
    process.exit();
}).catch(err => {
    console.error(`❌ 發放失敗: ${err}`);
    process.exit(1);
});
