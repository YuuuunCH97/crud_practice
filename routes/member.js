var express = require('express');
var router = express.Router();

// 顯示會員新增頁面
router.get('/', function(req, res, next) {
    res.render('create_member', { msg: null });
});

// 處理表單提交
router.post('/', function(req, res, next) {
    let email = req.body.email;
    let record_date = req.body.record_date;

    let sql = 'INSERT INTO member2024 (EMAIL, CREATE_DATE) VALUES (?, ?)';
    req.con.query(sql, [email, record_date], (err, result) => {
    if (err) {
        console.log(err);
        res.status(500).send('Error inserting data into the database');
    } else {
        res.redirect('/create_member?msg=Member added successfully');
    }
    });
});

module.exports = router;
