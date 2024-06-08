const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const DATA_PATH = path.join(__dirname, '../public/data/data.json');


const PRODUCT_DATA_PATH = path.join(__dirname, '../public/data/product.json');





// 渲染查詢會員頁面
router.get('/search_member', async (req, res) => {
    const newData = { user: 'xxx@gmail.com' };
    try {
        await fs.writeFile(DATA_PATH, JSON.stringify(newData, null, 2));
        console.log('File successfully written');
        
        const data = await fs.readFile(DATA_PATH, 'utf8');
        const jsonData = JSON.parse(data);
        res.render('search_member', jsonData);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// 創建會員
router.post('/create_member', async (req, res) => {
    const memberData = req.body;
    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        let jsonData = JSON.parse(data);
        
        jsonData.members = jsonData.members || [];
        jsonData.members.push(memberData);
        
        await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 2));
        console.log('Member created:', memberData.email);
        res.redirect('/create_member');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// 修改會員
router.post('/edit_member/:email', async (req, res) => {
    const email = req.params.email;
    const updatedMemberData = req.body;
    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        let jsonData = JSON.parse(data);
        
        const memberIndex = jsonData.members.findIndex(m => m.email === email);
        if (memberIndex === -1) {
            console.log('Member not found:', email);
            return res.status(404).send('未找到會員資料，請創建會員');
        }

        jsonData.members[memberIndex] = updatedMemberData;

        await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 2));
        console.log('Member updated:', email);

        res.render('edit_member', {
            member: updatedMemberData,
            showAlert: true
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// 渲染創建會員頁面
router.get('/create_member', (req, res) => {
    console.log('Rendering create_member page');
    res.render('create_member');
});

// 渲染购物车系统页面 /shop_sys
router.get('/shop_sys', async (req, res) => {
    try {
        const productData = await fs.readFile(PRODUCT_DATA_PATH, 'utf8');
        const products = JSON.parse(productData).products;
        res.render('shop_sys', { products });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});


// 渲染 shop_search 页面
router.get('/shop_search', (req, res) => {
    res.render('shop_search', { data: [] });
});

// 处理表单提交的 POST 请求
router.post('/shop_search', async (req, res) => {
    const startDate = req.body['start-date'] ? new Date(req.body['start-date']) : null;
    const endDate = req.body['end-date'] ? new Date(req.body['end-date']) : null;
    const email = req.body.email;

    if (!startDate || !endDate || !email) {
        return res.render('shop_search', { data: [], errorMessage: '請填寫日期或帳號' });
    }

    try {
        const data = await fs.readFile(path.join(__dirname, '../public/data/shop_searchdata.json'), 'utf8');
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

        res.render('shop_search', { data: filteredData, errorMessage: null });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
