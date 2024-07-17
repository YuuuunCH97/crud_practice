const memberModel = require('../models/memberModel');

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

const deleteMembers = async (req, res) => {
    const { selectedEmails } = req.body;
    if (!selectedEmails || selectedEmails.length === 0) {
        return res.status(400).send('沒有選擇任何會員');
    }
    const placeholders = selectedEmails.map(() => '?').join(',');
    try {
        const result = await memberModel.deleteMembers(placeholders, selectedEmails)
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
        console.log(err);
        return res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    createMember,
    searchMember,
    searchMemberPage,
    deleteMembers,
    editMember,
    editMemberPage
};
