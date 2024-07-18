const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const db = require('../db')
const memberController = require('../controllers/memberController');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// 設定存儲購物車資料的文件路徑

router.get('/', async (req, res) => {
    res.redirect('/search_member');
});

router.post('/get_country_city', memberController.getCountryCity);

router.get('/create_member', memberController.createMemberPage);
router.post('/create_member', memberController.createMember);

router.get('/search_member', memberController.searchMemberPage);
router.post('/search_member', memberController.searchMember);

router.post('/delete_selected_members', memberController.deleteMember);

router.get('/edit_member/:email', memberController.editMemberPage);
router.post('/edit_member/:email', memberController.editMember);

router.get('/shop_sys', memberController.shopSystem);
router.post('/shop_submit', memberController.shopSubmit);

router.get('/shop_search', memberController.shopSearchPage);

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

module.exports = router;
