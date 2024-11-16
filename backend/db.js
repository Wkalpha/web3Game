// @ts-ignore
const dotenv = require('dotenv');


dotenv.config();

const mysql = require('mysql2');

// 建立 MySQL 連接
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

// 設定 Web3 和合約資訊
const { Web3 } = require('web3');
const web3 = new Web3("wss://sepolia.infura.io/v3/1eb05ea628ac4f55b5543cb60a084c43"); // 換成你的 Infura 或本地節點地址
const contractAddress = "0x288a537992Cf17FBD468E03B88d9B17fcdf356E2"; // 智能合約地址
const contractABI = require("./contract/time.json"); // 載入合約的 ABI

const contract = new web3.eth.Contract(contractABI, contractAddress);
console.log("Available events:", Object.keys(contract.events));

if (contract.events.TokensPurchased) {
  contract.events.TokensPurchased({
    fromBlock: "latest"
  })
    .on("data", (event) => {
      console.log("TokensPurchased 事件觸發：", event);
      const { buyer, ethAmount, tokenAmount } = event.returnValues;
      console.log(`買家地址: ${buyer}`);
      console.log(`ETH 數量: ${web3.utils.fromWei(ethAmount, "ether")} ETH`);
      console.log(`代幣數量: ${tokenAmount}`);
    });
} else {
  console.error("TokensPurchased 事件不可用！");
}

// 連接到資料庫
db.connect((err) => {
    console.log('連接PORT', process.env.DB_PORT)
    if (err) {
        console.error('MySQL 連線失敗：', err);
        process.exit(1);
    } else {
        console.log('MySQL 連線成功');

        // 創建 UserInfo 資料表
        const createUserInfoTable = `
      CREATE TABLE IF NOT EXISTS UserInfo (
        Id BIGINT PRIMARY KEY AUTO_INCREMENT,
        WalletAddress VARCHAR(255) NOT NULL,
        TimeCoin DOUBLE DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Creator VARCHAR(255) NOT NULL
      )
    `;

        db.query(createUserInfoTable, (err, result) => {
            if (err) {
                console.error('建立 UserInfo 資料表失敗：', err);
            } else {
                console.log('UserInfo 資料表已確保存在');
            }
        });
    }
});

module.exports = db;
