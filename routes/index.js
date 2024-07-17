const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const { start } = require('repl');
const router = express.Router();
const db = require('../db')
const memberController = require('../controllers/memberController');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// 設定存儲購物車資料的文件路徑
const PRODUCT_DATA_PATH = path.join(__dirname, '../public/data/product.json');
const SHOP_SEARCH_PATH = path.join(__dirname, '../public/data/shop_searchdata.json');
const COUNTRY_CITY_PATH = path.join(__dirname, '../public/data/country_city.json');

router.get('/', async (req, res) => {
    res.redirect('/search_member');
});

router.post('/create_member', memberController.createMember);

router.get('/search_member', memberController.allMember);
router.post('/search_member', memberController.searchMember);

router.post('/delete_selected_members', memberController.del_members);

// 取出資料表
router.get('/mem2024', async function(req, res, next) {
    // 獲取連結
    const connection = await db.pool.getConnection();

    // 查詢獲取所有會員數據
    const [rows] = await connection.execute('SELECT * FROM member2024');
    // console.log('Query result:', rows); // 檢查資料

    // 釋放連接
    connection.release();
    res.render('mem2024', {  title: 'Member List', data: rows });
});


// 編輯會員資料的 POST 請求處理器
router.post('/edit_member/:email', async (req, res) => {
    const email = req.params.email;
    const updatedMemberData = req.body;

    let connection;
    try {
        // 獲取連接
        connection = await db.pool.getConnection();
        // 查詢
        const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);

        // 檢查是否找到了會員信息
        if (rows.length === 0) {
            console.log('Member not found:', email);
            return res.status(404).send('未找到會員資料，請創建會員');
        }

        // 執行更新操作
        await connection.execute(
            'UPDATE member2024 SET NAME = ?, COUNTRY = ?, CITY = ?, SEX = ?, NOTE = ?, RECORD_DATE = ? WHERE EMAIL = ?',
            [updatedMemberData.name, updatedMemberData.select_country, updatedMemberData.select_city, updatedMemberData.sex, updatedMemberData.note, updatedMemberData.record_date, email]
        );

        console.log('Member updated:', email);
        return res.redirect('/search_member');

    } catch (err) {
        console.error('錯誤:', err.stack);
        return res.status(500).send('內部伺服器錯誤');
    } finally {
        if (connection){
            // 確保連線被釋放
            connection.release();
        }
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
    const connection = await db.pool.getConnection();
    try {
        // 獲取連接
        console.log('Connecting to the database...');

        console.log('Database connection established.');
        console.log(`Fetching member data for email: ${email}`);
        const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);

        if (rows.length === 0) {
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
    } finally {
        if (connection){
            // 確保連線被釋放
            connection.release();
        }
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
        console.log('購物車資料嘗試保存:', { orderDate, serialNumber, email, purchasedItems });
        // 檢查 EMAIL 是否已存在

        // 獲取連接
        const connection = await db.pool.getConnection();

        const checkEmailSql = "SELECT COUNT(*) AS count FROM member2024 WHERE EMAIL = ?";
        const [rows] = await connection.execute(checkEmailSql, [email]);

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
        await connection.execute(updateSql, [orderDate, serialNumber, purchasedItems, email]);
        console.log('購物車資料已更新:', { orderDate, serialNumber, email, purchasedItems });
        return res.status(200).send('購物車資料已更新');
    } else {
        // 插入新購物車資料（若需要的話）
        const insertSql = `
            INSERT INTO member2024 (ORDER_DATE, SERIAL_NUMBER, EMAIL, PURCHASED_ITEMS)
            VALUES (?, ?, ?, ?)
        `;
        await connection.execute(insertSql, [orderDate, serialNumber, email, purchasedItems]);

        console.log('購物車資料已成功保存:', { orderDate, serialNumber, email, purchasedItems });
        return res.status(200).send('購物車資料已成功保存');
    }

} catch (err) {
    console.error('Error saving shop data:', err);
    return res.status(500).send('Internal Server Error');
} finally {
    // 釋放連接
    connection.release();
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
    const connection  = await db.pool.getConnection();

    try {
        // 從連接池獲取連接

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
        const [rows] = await connection.execute(query, params);

        console.log('Fetched data:', rows); // 在控制台記錄成功獲取的資料

        return res.render('shop_search', { data: rows, startDate, endDate, email });
    } catch (error) {
        console.error('Error fetching data from database:', error);
        return res.status(500).send('Internal Server Error');
    } finally {
    // 釋放連接
    connection.release();
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
