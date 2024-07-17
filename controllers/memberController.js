const memberModel = require('../models/memberModel');

const createMemberPage = async (req, res) => {
    return res.render('create_member', {"msg": "", "data": "{}"});
}

const createMember = async (req, res) => {
    const memberData = req.body;
    try {
        const result = await memberModel.createMember(memberData);

        if (result.success) {
            console.log('Member data inserted:', memberData.email);
            // 重定向到 create_member 頁面或其他適當的頁面
            res.redirect('/search_member');
        } else {
            return res.status(500).send('Internal Server Error');
        }
    } catch (err) {
        if (err.message === 'Email already exists.') {
            console.log(memberData)
            return res.render('create_member', {"msg": "帳號重複", "data": JSON.stringify(memberData)});
        }
        console.error('Error inserting member data:', err);
        return res.status(500).send('Internal Server Error');
    }
}

const searchMember = async (req, res) => {
    const { startDate, endDate, email, country, city } = req.body;
    try {
        const result = await memberModel.searchMember(startDate, endDate, email, country, city)
        res.render('search_member', result);
    } catch (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Internal Server Error');
    }
}

const searchMemberPage = async (req, res) => {
    try {
        const result = await memberModel.searchMemberPage()
        res.render('search_member', result);
    } catch (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Internal Server Error');
    }
}

const deleteMember = async (req, res) => {
    const { selectedEmails } = req.body;
    if (!selectedEmails || selectedEmails.length === 0) {
        return res.status(400).send('沒有選擇任何會員');
    }
    const placeholders = selectedEmails.map(() => '?').join(',');
    try {
        const result = await memberModel.deleteMember(placeholders, selectedEmails)
        if (result.success === true){
            res.redirect('/search_member');
        } else {
            return res.status(400).send(result.errorMessage);
            // 待測試
        }
    } catch (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Internal Server Error');
    }
}

const editMember = async (req, res) => {
    const email = req.params.email;
    const updatedMemberData = req.body;

    try {
        const result = await memberModel.editMember(email, updatedMemberData)
        if (result.success === true){
            res.redirect('/search_member');
        } else {
            return res.status(400).send(result.errorMessage);
        }
    } catch (err) {
        console.error('錯誤:', err.stack);
        return res.status(500).send('Internal Server Error');
    }
}

const editMemberPage = async (req, res) => {
    const email = req.params.email;
    try {
        const result = await memberModel.editMemberPage(email)
        if (result.success === true){
            return res.render('edit_member', result);
        } else {
            console.log(result.errorMessage)
            return res.status(400).send(result.errorMessage);
        }
    } catch (err) {
        return res.status(500).send('Internal Server Error');
    }
}




const fs = require('fs').promises;
const path = require('path');
const PRODUCT_DATA_PATH = path.join(__dirname, '../public/data/product.json');
const shopSystem = async (req, res) => {
    try {
        const productData = await fs.readFile(PRODUCT_DATA_PATH, 'utf8');
        const products = JSON.parse(productData).products;
        return res.render('shop_sys', { products });
    } catch (err) {
        return res.status(500).send('Internal Server Error');
    }
}

const shopSubmit = async (req, res) => {
    const { orderDate, serialNumber, email, purchasedItems } = req.body;
    console.log(orderDate, serialNumber, email, purchasedItems)
    // 檢查請求參數是否存在或有效
    if (!email || !orderDate || !serialNumber || !purchasedItems || purchasedItems.length === 0){
        return res.status(400).send('請輸入電子郵件地址和購物車項目');
    }
    try {
        const result = await memberModel.shopSubmit(orderDate, serialNumber, email, purchasedItems)
        if (result.success === true){
            return res.status(200).send('購物車資料已更新');
        } else {
            return res.status(400).send(result.errorMessage);
        }
    } catch (err) {
        return res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    createMember,
    createMemberPage,
    searchMember,
    searchMemberPage,
    deleteMember,
    editMember,
    editMemberPage,
    shopSystem,
    shopSubmit
};
