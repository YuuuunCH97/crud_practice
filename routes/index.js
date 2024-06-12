const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const DATA_PATH = path.join(__dirname, '../public/data/data.json');
const PRODUCT_DATA_PATH = path.join(__dirname, '../public/data/product.json');
// 設定存儲購物車資料的文件路徑
const SHOP_SEARCH_PATH = path.join(__dirname, '../public/data/shop_searchdata.json');

const COUNTRY_CITY_PATH = path.join(__dirname, '../public/data/country_city.json');


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

// 渲染查詢會員頁面，初始頁面不顯示會員資料
router.get('/search_member', (req, res) => {
    res.render('search_member', { data: [], errorMessage: null });
});


// 处理查询会员的 POST 请求
router.post('/search_member', async (req, res) => {
    const { startDate, endDate, email, country, city } = req.body;
    // 檢查是否所有字段都為空
    const isEmpty = !startDate && !endDate && !email && !country && !city;

    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        let jsonData = JSON.parse(data).members || [];

        let filteredData = [];
        // 如果所有字段都为空，则不发送任何会员数据到前端
        if (!isEmpty) {
            filteredData = jsonData.filter(member => {
                const recordDate = new Date(member.recordDate);
                return (!startDate || recordDate >= new Date(startDate)) &&
                    (!endDate || recordDate <= new Date(endDate)) &&
                    (!email || member.email.includes(email)) &&
                    (!country || member.select_country === country) &&
                    (!city || member.select_city === city);
            });
        }


        res.render('search_member', { data: filteredData, errorMessage: filteredData.length === 0 ? null : null });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});


// POST 請求處理刪除選取的會員
router.post('/delete_selected_members', async (req, res) => {
    const { selectedEmails } = req.body;
    try {
        // 讀取現有會員數據
        const data = await fs.readFile(DATA_PATH, 'utf8');
        const jsonData = JSON.parse(data);

        // 刪除選中的會員
        jsonData.members = jsonData.members.filter(member => !selectedEmails.includes(member.email));

        // 寫入更新後的數據到 data.json 文件中
        await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 4), 'utf8');

        res.status(200).send('成功刪除選取的會員');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
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

router.post('/create_member', async (req, res) => {
    const memberData = req.body;

    // 检查是否存在 record_date，如果没有，则生成当前日期
    if (!memberData.record_date) {
        memberData.record_date = new Date().toLocaleDateString('en-CA'); // 格式为 YYYY-MM-DD
    }

    try {
        // 读取现有数据
        const data = await fs.readFile(DATA_PATH, 'utf8');
        let jsonData;
        
        try {
            jsonData = JSON.parse(data); // 解析 JSON 数据
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).send('Internal Server Error');
        }

        // 确保 members 数组存在
        if (!Array.isArray(jsonData.members)) {
            jsonData.members = [];
        }

        console.log(memberData, '!!!!!!!!!!!!!!!')
        // 掃描是否有重複的帳號
        for (i=1; i<=jsonData.members.length; i++ ) {
            if (jsonData.members[i]['email'] == memberData['email']){
                
            }
        }

        // 添加新成员数据
        jsonData.members.push(memberData);

        // 写入文件
        await fs.writeFile(DATA_PATH, JSON.stringify(jsonData, null, 2));
        console.log('Member created:', memberData.email);

        // 重定向到 create_member 页面
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

        res.redirect(`/edit_member/${encodeURIComponent(updatedMemberData.email)}`);
    } catch (err) {
        console.error('Error:', err.stack);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/edit_member/:email', async (req, res) => {
    const email = req.params.email;
    console.log('收到编辑会员请求，邮箱:', email);

    try {
        console.log('Reading data file:', DATA_PATH);
        //讀取數據文件
        const data = await fs.readFile(DATA_PATH, 'utf8');
        console.log('Data file read successfully');
        const jsonData = JSON.parse(data);//解析json
        console.log('JSON data parsed successfully');
        const member = jsonData.members.find(member => member.email === email);
        if (!member) {
            console.log('Member not found:', email);
            return res.status(404).send('未找到会员数据，请创建会员');
        }

        res.render('edit_member', { member: member });
        console.log('找到会员:', member);
        // 添加调试信息
        console.log('准备渲染模板');
        res.render('edit_member', { member: member }, (err, html) => {
            if (err) {
                console.error('模板渲染错误:', err);
                if (!res.headersSent) {
                    return res.status(500).send(`内部服务器错误: ${err.message}`);
                }
            } else {
                res.send(html);
                console.log('模板渲染成功');
            }
        });
    } catch (err) {
        console.error('错误:', err.stack);
        if (!res.headersSent) {
            res.status(500).send(`内部服务器错误: ${err.message}`);
        }
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

// 处理购物车提交的 POST 请求
router.post('/shop_submit', async (req, res) => {
    const { email, items } = req.body;

    if (!email || !items || items.length === 0) {
        return res.status(400).send('請輸入帳號和購物車項目');
    }

    const generateSerialNumber = () => {
        return 'shop' + Math.floor(1000000000 + Math.random() * 9000000000);
    };

    const newCartData = {
        purchaseDate: new Date().toISOString().split('T')[0],
        serialNumber: generateSerialNumber(),
        email: email,
        items: items
    };

    try {
        let shopData = [];
        try {
            const data = await fs.readFile(SHOP_SEARCH_PATH, 'utf8');
            if (data) {
                shopData = JSON.parse(data);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('Error reading shop search file:', err);
                return res.status(500).send('Internal Server Error');
            }
        }

        shopData.push(newCartData);

        await fs.writeFile(SHOP_SEARCH_PATH, JSON.stringify(shopData, null, 2), 'utf8');
        console.log('購物車資料已成功保存:', newCartData);

        res.status(200).send('購物車資料已成功保存');
    } catch (err) {
        console.error('Error saving shop search data:', err);
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
        res.json({receivedData: country_city_list});
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
