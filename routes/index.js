const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const { start } = require('repl');
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const DATA_PATH = path.join(__dirname, '../public/data/data.json');
const PRODUCT_DATA_PATH = path.join(__dirname, '../public/data/product.json');
// 設定存儲購物車資料的文件路徑
const SHOP_SEARCH_PATH = path.join(__dirname, '../public/data/shop_searchdata.json');

const COUNTRY_CITY_PATH = path.join(__dirname, '../public/data/country_city.json');


const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'member_data',
    insecureAuth: true
};

// 建立 MySQL 連線池
const pool = mysql.createPool(dbConfig);


// 取出資料表
router.get('/mem2024', function(req, res, next) {
    console.log('Handling GET request for /mem2024'); // 打印路由处理函数开始的日志
    var db = req.con;
    // 執行資料庫查詢
    db.query('SELECT * FROM member2024', function(err, rows) {
        if (err) {
            console.log('Database query error:', err); //數據查詢錯誤
            return next(err); // 錯誤處理
        }
        console.log('Query result:', rows); // 檢查資料
        //var data = rows; // 將資料存入 data 變數
        res.render('mem2024', {  title: 'Member List', data: rows });
    });
});


// 渲染查詢會員頁面
//router.get('/search_member', async (req, res) => {
//    const newData = { user: 'xxx@gmail.com' };
//    try {
//        await fs.writeFile(DATA_PATH, JSON.stringify(newData, null, 2));
//        console.log('File successfully written');
//        
//        const data = await fs.readFile(DATA_PATH, 'utf8');
//        const jsonData = JSON.parse(data);
//        res.render('search_member', jsonData);
//    } catch (err) {
//        console.error('Error:', err);
//        res.status(500).send('Internal Server Error');
//    }
//});


// 渲染查詢會員頁面
// router.get('/search_member', async (req, res) => {
//     try {
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         const jsonData = JSON.parse(data);
//         res.render('search_member', { data: jsonData.members || [], errorMessage: null });
//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });

// 渲染查詢會員頁面，初始頁面顯示會員資料
// router.get('/search_member', async (req, res) => {
//     const data = await fs.readFile(DATA_PATH, 'utf8');
//     let jsonData = JSON.parse(data).members || [];
//     return res.render('search_member', { data: jsonData, errorMessage: null });
// });

router.get('/search_member', async (req, res) => {
    try {
        // 獲取連結
        const connection = await pool.getConnection();
        // 查詢獲取所有會員數據
        const [rows, fields] = await connection.execute('SELECT * FROM member2024');
        // 释放连接回连接池
        connection.release();

        // 回傳所有會員數據
        res.render('search_member', { data: rows, errorMessage: null });
    } catch (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Internal Server Error');
    }
});

// // 處理查尋會員的 POST 請求
// router.post('/search_member', async (req, res) => {
//     const { startDate, endDate, email, country, city } = req.body;
//     // 輸出請求的查詢條件以進行調試
//     console.log('Received search criteria:', { startDate, endDate, email, country, city });
//     // 檢查是否所有字段都為空
//     const isEmpty = !startDate && !endDate && !email && !country && !city;

//     try {
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         let jsonData = JSON.parse(data).members || [];
//         let filteredData = [];
//         //如果所有字段都為空，則不發送任何會員數據到前端
//         if (!isEmpty) {
//             filteredData = jsonData.filter(member => {
//                 const recordDate = new Date(member.recordDate);
//                 //調試輸出每個條件的值和匹配結果
//                 return (!startDate || recordDate >= new Date(startDate)) &&
//                     (!endDate || recordDate <= new Date(endDate)) && 
//                     (!email || member.email.includes(email)) &&
//                     (!country || member.select_country === country) &&
//                     (!city || member.select_city === city);
//             });
//         }
//         //檢查篩選後的數據是否為空，並設置相應的錯誤消息
//         const errorMessage = filteredData.length === 0 ? '找不到符合條件的會員' : null;
//         console.log("Filtered Data:", filteredData);
//         return res.render('search_member', { data: filteredData, errorMessage: filteredData.length === 0 ? null : null });
//     } catch (err) {
//         console.error('Error:', err);
//         return res.status(500).send('Internal Server Error');
//     }
// });

router.post('/search_member', async (req, res) => {
    const { startDate, endDate, email, country, city } = req.body;
    // 輸出請求的查詢條件以進行調試
    console.log('Received search criteria:', { startDate, endDate, email, country, city });
    // 構建 SQL 查詢語句
    let sql = 'SELECT * FROM member2024 WHERE 1 = 1';
    let params = [];

    // 檢查並擴展 SQL 查詢
    if (startDate) {
        sql += ' AND record_date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND record_date <= ?';
        params.push(endDate);
    }
    if (email) {
        sql += ' AND email LIKE ?';
        params.push(`%${email}%`);
    }
    if (country) {
        sql += ' AND COUNTRY  = ?';
        params.push(country);
    }
    if (city) {
        sql += ' AND CITY = ?';
        params.push(city);
    }

    try {
        // 執行 SQL 查詢前輸出調試日誌
        console.log('Executing SQL:', sql, params);
        // 從連線池獲取連線
        const connection = await pool.getConnection();
        // 執行 SQL 查詢
        const [rows, fields] = await connection.execute(sql, params);        
        // 釋放連線回連線池
        connection.release();

        // 調試輸出查詢結果
        console.log('Query result:', rows);

        // 將查詢結果傳遞到前端顯示，以及可能的錯誤消息
        const errorMessage = rows.length === 0 ? '找不到符合條件的會員' : null;
        return res.render('search_member', { data: rows, errorMessage });
    } catch (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Internal Server Error');
    }
});


// // POST 請求處理刪除選取的會員
// router.post('/delete_selected_members', async (req, res) => {
//     const { selectedEmails } = req.body;
//     try {
//         // 讀取現有會員數據
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         const jsonData = JSON.parse(data);
//         // 刪除選中的會員
//         jsonData.members = jsonData.members.filter(member => !selectedEmails.includes(member.email));
//         // 寫入更新後的數據到 data.json 文件中
//         await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 4), 'utf8');
//         return res.status(200).send('成功刪除選取的會員');
//     } catch (err) {
//         console.error('Error:', err);
//         return res.status(500).send('Internal Server Error');
//     }
// });

// 刪除會員的 POST 請求處理器
router.post('/delete_selected_members', async (req, res) => {
    const { selectedEmails } = req.body;

    if (!selectedEmails || selectedEmails.length === 0) {
        return res.status(400).send('沒有選擇任何會員');
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // 構建刪除查詢
        const placeholders = selectedEmails.map(() => '?').join(',');
        const sql = `DELETE FROM member2024 WHERE EMAIL IN (${placeholders})`;

        // 執行刪除查詢
        await connection.execute(sql, selectedEmails);

        console.log('Deleted members:', selectedEmails);
        return res.status(200).send('成功刪除選取的會員');
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Internal Server Error');
    }
});


// // 創建會員
// router.post('/create_member', async (req, res) => {
//     const memberData = req.body;
//     // 检查是否存在 record_date，没有的话在服务器端生成当前日期
//     if (!memberData.record_date) {
//         memberData.record_date = new Date().toISOString().split('T')[0]; // 获取当前日期并格式化为 YYYY-MM-DD
//     }
//     try {
//         // 读取现有数据
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         let jsonData = JSON.parse(data);
//         // 确保members数组存在
//         jsonData.members = jsonData.members || [];
//         // 添加新成员数据
//         jsonData.members.push(memberData);
        
//         await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 2));
//         console.log('Member created:', memberData.email);
//         res.redirect('/create_member');
//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });

//////  資料加入 data
// router.post('/create_member', async (req, res) => {
//     const memberData = req.body;

//     // 检查是否存在 record_date，如果没有，则生成当前日期
//     if (!memberData.record_date) {
//         memberData.record_date = new Date().toLocaleDateString('en-CA'); // 格式为 YYYY-MM-DD
//     }

//     try {
//         // 读取现有数据
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         let jsonData;
        
//         try {
//             jsonData = JSON.parse(data); // 解析 JSON 数据
//         } catch (parseError) {
//             console.error('Error parsing JSON:', parseError);
//             return res.status(500).send('Internal Server Error');
//         }

//         // 确保 members 数组存在
//         if (!Array.isArray(jsonData.members)) {
//             jsonData.members = [];
//         }

//         // 掃描是否有重複的帳號
//         for (i=0; i<=jsonData.members.length; i++ ) {
//             let data_email = jsonData.members[i] || {'email': ''}
//             if (data_email['email'] == memberData['email']){
//                 let memberData_json = JSON.stringify(memberData)
//                 return res.render('create_member', {"msg": "帳號重複", "data": memberData_json});
//             }
//         }
//         // 添加新成员数据
//         jsonData.members.push(memberData);
//         // 写入文件
//         await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 2));
//         console.log('Member created:', memberData.email);

//         // 重定向到 create_member 页面
//         res.redirect('/search_member');
//     } catch (err) {
//         console.error('Error:', err);
//         return res.status(500).send('Internal Server Error');
//     }
// });

///////資料加入mysql


router.post('/create_member', async (req, res) => {
    const memberData = req.body;

    // 檢查是否存在 record_date，如果沒有則生成當前日期
    if (!memberData.record_date) {
        memberData.record_date = new Date().toLocaleDateString('en-CA'); // 格式為 YYYY-MM-DD
    }
    try {
        // 建立 MySQL 連接
        const con = req.con;
        // 檢查 EMAIL 是否已存在
        const checkEmailSql = "SELECT COUNT(*) AS count FROM member2024 WHERE EMAIL = ?";
        const [rows] = await con.promise().execute(checkEmailSql, [memberData.email]);
        const emailExists = rows[0].count > 0;

        if (emailExists) {
            // 如果 EMAIL 已存在，返回錯誤
            return res.status(400).send('Email already exists.');
        }
        
        // 插入資料到 member2024 表
        const sql = "INSERT INTO member2024 (EMAIL, NAME, COUNTRY, CITY, INTERESTS, NOTE, RECORD_DATE) VALUES (?, ?, ?, ?, ?, ?, ?)";
        await con.promise().execute(sql, [
            memberData.email,
            memberData.name,
            memberData.select_country,
            memberData.select_city,
            JSON.stringify(memberData.interests), // 將興趣轉為 JSON 字串存儲
            memberData.note,
            memberData.record_date
        ]);

        console.log('Member data inserted:', memberData.email);

        // 重定向到 create_member 頁面或其他適當的頁面
        res.redirect('/search_member');
    } catch (err) {
        console.error('Error inserting member data:', err);
        return res.status(500).send('Internal Server Error');
    }
});


// 修改會員
// router.post('/edit_member/:email', async (req, res) => {
//     const email = req.params.email;

//     const updatedMemberData = req.body;
//     try {
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         let jsonData = JSON.parse(data);
        
//         const memberIndex = jsonData.members.findIndex(m => m.email === email);
//         if (memberIndex === -1) {
//             console.log('Member not found:', email);
//             return res.status(404).send('未找到會員資料，請創建會員');
//         }
//         updatedMemberData['record_date'] = jsonData.members[memberIndex]['record_date']
//         jsonData.members[memberIndex] = updatedMemberData;
//         await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 2));
//         console.log('Member updated:', email);

//         // res.redirect(`/edit_member/${encodeURIComponent(updatedMemberData.email)}`);
//         res.redirect('/search_member');
//     } catch (err) {
//         console.error('Error:', err.stack);
//         return res.status(500).send('Internal Server Error');
        
//     }
// });

// 編輯會員資料的 POST 請求處理器
router.post('/edit_member/:email', async (req, res) => {
    const email = req.params.email;
    const updatedMemberData = req.body;

    try {
        // 创建数据库连接
        const connection = await mysql.createConnection(dbConfig);
        // 查询要更新的会员信息
        const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);
        // 检查是否找到了会员信息
        if (rows.length === 0) {
            console.log('Member not found:', email);
            await connection.end(); // 结束数据库连接
            return res.status(404).send('未找到會員資料，請創建會員');
        }
        // 执行更新操作
        await connection.execute(
            'UPDATE member2024 SET NAME = ?, COUNTRY = ?, CITY = ?, SEX = ?, NOTE = ?, RECORD_DATE = ? WHERE EMAIL = ?',
            [updatedMemberData.name, updatedMemberData.select_country, updatedMemberData.select_city, updatedMemberData.sex, updatedMemberData.note, updatedMemberData.record_date, email]
        );

        console.log('Member updated:', email);
        // 关闭数据库连接
        await connection.end(); // 结束数据库连接
        return res.redirect('/search_member');

    } catch (err) {
        console.error('錯誤:', err.stack);
        return res.status(500).send('內部伺服器錯誤');
    }
});



// 編輯會員資料的 GET 請求處理器
// router.get('/edit_member/:email', async (req, res) => {
//     const email = req.params.email;
//     try {
//         //讀取數據文件
//         const data = await fs.readFile(DATA_PATH, 'utf8');
//         const jsonData = JSON.parse(data); //解析json
//         const member = jsonData.members.find(member => member.email === email);
//         if (!member) {
//             console.log('Member not found:', email);
//             return res.status(404).send('未找到會員數據，請建立會員');
//         }
//         return res.render('edit_member', {data: JSON.stringify(member), "msg": ""});
//     } catch (err) {
//         console.error('錯誤:', err.stack);
//         if (!res.headersSent) {
//             return res.status(500).send(`內部伺服器錯誤: ${err.message}`);
//         }
//     }
// });

// 編輯會員資料的 GET 請求處理器
// router.get('/edit_member/:email', async (req, res) => {
//     const email = req.params.email;
//     try {
//         const connection = await mysql.createConnection(dbConfig);
//         const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);

//         if (rows.length === 0) {
//             console.log('Member not found:', email);
//             return res.status(404).send('未找到會員數據，請建立會員');
//         }

//         const member = rows[0];
//         return res.render('edit_member', { data: JSON.stringify(member), msg: "" });  // Render the member object directly
//     } catch (err) {
//         console.error('錯誤:', err.stack);
//         return res.status(500).send(`內部伺服器錯誤: ${err.message}`);
//     } finally {
//         if (connection) {
//             try {
//                 await connection.end();  // Close the database connection
//             } catch (err) {
//                 console.error('關閉資料庫連接錯誤:', err);
//             }
//         }
//     }
// });



router.get('/edit_member/:email', async (req, res) => {
    const email = req.params.email;
    
    try {
        console.log('Connecting to the database...');
        const connection = await mysql.createConnection(dbConfig); // 創建數據庫連接
        console.log('Database connection established.');
        console.log(`Fetching member data for email: ${email}`);
        const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);

        if (rows.length === 0) {
            console.log('Member not found:', email);
            return res.status(404).send('未找到會員數據，請建立會員');
        }

        const member = rows[0];
        // 解析 JSON 字符串為 JavaScript 對象或數組
        try {
            member.INTERESTS = JSON.parse(member.INTERESTS);
        } catch (parseError) {
            console.error('Error parsing INTERESTS JSON:', parseError);
            member.INTERESTS = []; // 設置一個默認值，例如空陣列
        }
        console.log('Member found:', member);
        console.log('Rendering edit_member page with data:', member);
        return res.render('edit_member', { member: member, msg: "" });
    } catch (err) {
        console.error('內部伺服器錯誤:', err.message);
        console.error('錯誤堆疊:', err.stack);
        console.error('請求資訊:', {
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
            body: req.body
        });
        return res.status(500).send(`內部伺服器錯誤: ${err.message}`);
    }
});






// 渲染創建會員頁面
router.get('/create_member', (req, res) => {
    console.log('Rendering create_member page');
    return res.render('create_member', {"msg": "", "data": "{}"});    
});

// 渲染購物車系統頁面 /shop_sys
router.get('/shop_sys', async (req, res) => {
    try {
        const productData = await fs.readFile(PRODUCT_DATA_PATH, 'utf8');
        const products = JSON.parse(productData).products;
        return res.render('shop_sys', { products });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Internal Server Error');
    }
});

// 渲染購物車系統頁面 獲取email
// router.get('/shop_sys', async (req, res) => {
//     try {
//         const connection = await pool.getConnection();
//         const [rows] = await connection.execute('SELECT EMAIL FROM member2024');
//         connection.release();
//         res.json(rows);
//     } catch (err) {
//         console.error('Error fetching emails:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });


// 处理购物车提交的 POST 请求
// router.post('/shop_submit', async (req, res) => {
//     const { email, items } = req.body;

//     if (!email || !items || items.length === 0) {
//         return res.status(400).send('請輸入帳號和購物車項目');
//     }

//     const generateSerialNumber = () => {
//         return 'shop' + Math.floor(1000000000 + Math.random() * 9000000000);
//     };

//     const newCartData = {
//         purchaseDate: new Date().toISOString().split('T')[0],
//         serialNumber: generateSerialNumber(),
//         email: email,
//         items: items
//     };

//     try {
//         let shopData = [];
//         try {
//             const data = await fs.readFile(SHOP_SEARCH_PATH, 'utf8');
//             if (data) {
//                 shopData = JSON.parse(data);
//             }
//         } catch (err) {
//             if (err.code !== 'ENOENT') {
//                 console.error('Error reading shop search file:', err);
//                 return res.status(500).send('Internal Server Error');
//             }
//         }

//         shopData.push(newCartData);

//         await fs.writeFile(SHOP_SEARCH_PATH, JSON.stringify(shopData, null, 2), 'utf8');
//         console.log('購物車資料已成功保存:', newCartData);

//         return res.status(200).send('購物車資料已成功保存');
//     } catch (err) {
//         console.error('Error saving shop search data:', err);
//         return res.status(500).send('Internal Server Error');
//     }
// });

//更新現有資料而不是插入新資料
router.post('/shop_submit', async (req, res) => {
    const { orderDate, serialNumber, email, purchasedItems } = req.body;

    // 檢查請求參數是否存在或有效
    if (!email || !orderDate || !serialNumber || !purchasedItems || purchasedItems.length === 0){
        console.log('Invalid request parameters:', { orderDate, serialNumber, email, purchasedItems });
        return res.status(400).send('請輸入電子郵件地址和購物車項目');
    }

    try {
        const con = req.con;
        console.log('購物車資料嘗試保存:', { orderDate, serialNumber, email, purchasedItems });
        // 檢查 EMAIL 是否已存在
        const checkEmailSql = "SELECT COUNT(*) AS count FROM member2024 WHERE EMAIL = ?";
        const [rows] = await con.promise().execute(checkEmailSql, [email]);
        const emailExists = rows[0].count > 0;

        console.log('Email exists:', emailExists);

        if (!emailExists) {
            // 如果 EMAIL 不存在，返回無會員資料的訊息
            return res.status(404).send('無會員資料，無法新增購物車資料');
        } 
        // 將 purchasedItems 轉換為 JSON 字符串
        const purchasedItemsJson = JSON.stringify(purchasedItems);

        // 如果 EMAIL 已存在，可以更新該記錄而不是插入新的
        if (emailExists) {
            // 更新購物車資料
            const updateSql = `
                UPDATE member2024
                SET ORDER_DATE = ?,
                    SERIAL_NUMBER = ?,
                    PURCHASED_ITEMS = ?
                WHERE EMAIL = ?
        `;
        await con.promise().execute(updateSql, [orderDate, serialNumber, purchasedItems, email]);

        console.log('購物車資料已更新:', { orderDate, serialNumber, email, purchasedItems });
        return res.status(200).send('購物車資料已更新');
    } else {
        // 插入新購物車資料（若需要的話）
        const insertSql = `
            INSERT INTO member2024 (ORDER_DATE, SERIAL_NUMBER, EMAIL, PURCHASED_ITEMS)
            VALUES (?, ?, ?, ?)
        `;
        await con.promise().execute(insertSql, [orderDate, serialNumber, email, purchasedItems]);

        console.log('購物車資料已成功保存:', { orderDate, serialNumber, email, purchasedItems });
        return res.status(200).send('購物車資料已成功保存');
    }
    
} catch (err) {
    console.error('Error saving shop data:', err);
    return res.status(500).send('Internal Server Error');
}
});


// 渲染 shop_search

// router.get('/shop_search', async(req, res) => {
//     const data = await fs.readFile(SHOP_SEARCH_PATH, 'utf8');
//     const jsonData = JSON.parse(data);
//     return res.render('shop_search', { data: jsonData , startDate: "", endDate: "", email: ""});
// });

router.get('/shop_search', async (req, res) => {
    const { startDate, endDate, email } = req.query;

    try {
        // 從連接池獲取連接
        const con = await pool.getConnection();

        let query = "SELECT ORDER_DATE, SERIAL_NUMBER, EMAIL, PURCHASED_ITEMS FROM member2024";
        const params = [];

        // 如果有過濾條件，則添加到查詢中
        if (startDate && endDate && email) {
            query += ` WHERE DATE(ORDER_DATE) BETWEEN ? AND ? AND EMAIL = ?`;
            params.push(startDate, endDate, email);
        } else if (startDate && endDate) {
            query += ` WHERE DATE(ORDER_DATE) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (email) {
            query += ` WHERE EMAIL = ?`;
            params.push(email);
        }
        console.log('Executing query:', query, params); // 在控制台記錄即將執行的查詢和參數
        const [rows] = await con.execute(query, params);

        // 釋放連接
        con.release();
        console.log('Fetched data:', rows); // 在控制台記錄成功獲取的資料

        return res.render('shop_search', { data: rows, startDate, endDate, email });
    } catch (error) {
        console.error('Error fetching data from database:', error);
        return res.status(500).send('Internal Server Error');
    }
});



// 处理表单提交的 POST 请求
router.post('/shop_search', async (req, res) => {
    const startDate = req.body['start-date'] ? new Date(req.body['start-date']) : null;
    const endDate = req.body['end-date'] ? new Date(req.body['end-date']) : null;
    const email = req.body.email;

    if (!startDate || !endDate || !email) {
        return res.status(500).send('Internal Server Error');
    }

    try {
        const data = await fs.readFile(SHOP_SEARCH_PATH, 'utf8');
        const jsonData = JSON.parse(data);

        const filteredData = jsonData.filter(item => {
            const purchaseDate = new Date(item.purchaseDate);
            if ((startDate && purchaseDate < startDate) || (endDate && purchaseDate > endDate)) {
                return false;
            }
            if (email && item.email !== email) {
                return false;
            }
            return true;
        });

        return res.render('shop_search', { data: filteredData, startDate: req.body['start-date'], endDate: req.body['end-date'], email: email});
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Internal Server Error');
    }
});

router.post('/get_country_city', async (req, res) => {
    // 無輸入參數 {} >> 取得國家list資料
    // 輸入參數 {"country": "台灣"} >> 取得城市list資料
    try {
        const country = req.body['country'];
        const jsonData_text = await fs.readFile(COUNTRY_CITY_PATH, 'utf8');
        const jsonData = JSON.parse(jsonData_text);
        let country_city_list
        if (country){
            country_city_list = jsonData[country]
        } else {
            country_city_list = Object.keys(jsonData)
        }
        return res.json({receivedData: country_city_list});
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
