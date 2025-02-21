const pool = require('../pool');

const createRoomsTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS Rooms (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        RoomCode VARCHAR(10) UNIQUE NOT NULL,
        Players INT NOT NULL,
        CurrentPlayers INT DEFAULT 1 NOT NULL,
        MinBet INT NOT NULL,
        BetAmount INT NOT NULL,
        Pwd VARCHAR(4),
        status ENUM('waiting', 'playing', 'ended') DEFAULT 'waiting' NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
    await pool.execute(createTableSql);
    console.log('Rooms 資料表已確保存在');
};

module.exports = createRoomsTable;
