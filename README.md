
# 安裝套件

```bash
npm install -g express-generator
npm install -g nodemon

# 有缺模組執行
npm install

# 執行有問題的話 嘗試修復
npm audit fix --force
```

# 啟動專案

```bash
nodemon start
```

```bash
#看端口 
netstat -ano | findstr :8888

#終止端口
taskkill /PID ***** /F
```

## 資料庫設定

1. 下載安裝(mysql)[https://dev.mysql.com/downloads/mysql/]
2. 建立資料庫 member_data
3. 執行以下指令

```sql
CREATE TABLE member2024 (
  ID int(11) NOT NULL AUTO_INCREMENT,
  EMAIL varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  SEX enum('male', 'female', 'other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  NAME varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  COUNTRY varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  CITY varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  INTERESTS text COLLATE utf8mb4_unicode_ci,
  NOTE text COLLATE utf8mb4_unicode_ci,
  RECORD_DATE date DEFAULT NULL,
  SERIAL_NUMBER varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL UNIQUE,
  ORDER_DATE date DEFAULT NULL,
  PURCHASED_ITEMS text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

(dberve 無法連線處理)[https://sinyilin.github.io/SQL/20230425/4002286829/]
