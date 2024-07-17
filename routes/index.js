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

const SHOP_SEARCH_PATH = path.join(__dirname, '../public/data/shop_searchdata.json');
const COUNTRY_CITY_PATH = path.join(__dirname, '../public/data/country_city.json');

router.get('/', async (req, res) => {
    res.redirect('/search_member');
});

router.get('/create_member', memberController.createMemberPage);
router.post('/create_member', memberController.createMember);

router.get('/search_member', memberController.searchMemberPage);
router.post('/search_member', memberController.searchMember);

router.post('/delete_selected_members', memberController.deleteMember);

router.get('/edit_member/:email', memberController.editMemberPage);
router.post('/edit_member/:email', memberController.editMember);

router.get('/shop_sys', memberController.shopSystem);
router.post('/shop_submit', memberController.shopSubmit);

router.get('/mem2024', async function(req, res, next) {
    // Bard: 懶懶的 不想動這個!!!
    // 獲取連結
    const connection = await db.pool.getConnection();

    // 查詢獲取所有會員數據
    const [rows] = await connection.execute('SELECT * FROM member2024');
    // console.log('Query result:', rows); // 檢查資料

    // 釋放連接
    connection.release();
    res.render('mem2024', {  title: 'Member List', data: rows });
});


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
