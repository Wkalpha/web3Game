// @ts-ignore
const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2/promise'); // 使用 mysql2/promise 版本
const { Web3 } = require('web3');

// 初始化 MySQL 連線池 (避免連線未準備好問題)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10, // 允許的最大連接數
  queueLimit: 0
});

// Web3 和合約初始化
const INFURA_URL = 'wss://sepolia.infura.io/ws/v3/1eb05ea628ac4f55b5543cb60a084c43';
const web3 = new Web3(INFURA_URL);
const contractAddress = process.env.Web3ContractAddress;
const contractABI = require("./contract/time.json");

const contract = new web3.eth.Contract(contractABI, contractAddress);

// 測試區塊鏈連接
web3.eth.getBlockNumber()
    .then(blockNumber => console.log(`Current block number: ${blockNumber}`))
    .catch(error => console.error(`Error: ${error}`));

// 監聽購買代幣的事件
contract.events.TokensPurchased()
    .on('data', async (event) => {
        console.log(event); // 可以選擇不顯示

        const weiToEth = web3.utils.fromWei(event.returnValues.ethAmount, 'ether');
        const timeCoin = weiToEth * 10000; // 1 ETH = 10000 TimeCoin
        const buyer = event.returnValues.buyer;

        try {
            // 1️⃣ 更新 UserInfo 的 TimeCoin
            const updateUserTimeCoinSql = `
                UPDATE UserInfo
                SET TimeCoin = TimeCoin + ?
                WHERE WalletAddress = ?
            `;
            const [userUpdateResult] = await db.execute(updateUserTimeCoinSql, [timeCoin, buyer]);
            console.log(`UserInfo 更新成功，受影響行數: ${userUpdateResult.affectedRows}`);

            // 2️⃣ 更新 PrizePool 的 Amount
            const updatePrizePoolSql = `
                UPDATE PrizePool
                SET Amount = Amount + ?
                WHERE ID = 1
            `;
            const [prizePoolUpdateResult] = await db.execute(updatePrizePoolSql, [weiToEth]);
            console.log(`PrizePool 更新成功，受影響行數: ${prizePoolUpdateResult.affectedRows}`);

        } catch (err) {
            console.error('更新 UserInfo 或 PrizePool 失敗:', err);
        }
    });

// 確保 UserInfo 資料表存在
(async () => {
  try {
    const createUserInfoTable = `
      CREATE TABLE IF NOT EXISTS UserInfo (
        Id BIGINT PRIMARY KEY AUTO_INCREMENT,
        WalletAddress VARCHAR(255) NOT NULL,
        TimeCoin DOUBLE DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Creator VARCHAR(255) NOT NULL
      )
    `;
    const [result] = await db.execute(createUserInfoTable);
    console.log('UserInfo 資料表已確保存在');
  } catch (err) {
    console.error('建立 UserInfo 資料表失敗：', err);
  }
})();

module.exports = db;
