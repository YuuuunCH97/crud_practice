
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

# 打開網頁輸入網址

```
http://127.0.0.1:8888/create_member
```

```bash
#看端口 
netstat -ano | findstr :8888

#終止端口
taskkill /PID ***** /F

```

