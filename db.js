const mysql = require('mysql2/promise');

const fs = require('fs');
const ini = require('ini');
const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

// 設定 MySQL 連線配置
const pool = mysql.createPool({
    host: config['DATABASE']['HOST'],
    user: config['DATABASE']['USER'],
    password: config['DATABASE']['PASSWORD'],
    database: 'member_data',
    port: config['DATABASE']['PORT'],
    insecureAuth: true, // 指示是否允許使用不安全的驗證方式進行資料庫連線
    waitForConnections: true, // 指示當連線池耗盡並且連線數量已達到上限時，是否要等待空閒連線可用再進行新的連線嘗試。
    connectionLimit: 10, // 指示連線池中最多可以同時存在的連線數量
    queueLimit: 0 // 指示在達到 connectionLimit 且所有連線都在使用中時，允許在內部等待佇列中排隊的最大連線數量
    });

module.exports = {
    pool
};
