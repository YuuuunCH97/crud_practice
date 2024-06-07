const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const fs = require('fs');

const bodyParser = require("body-parser"); 

const path = require("path");



/*cookies*/
router.get("/cookies", function (req, res, next) {
  console.log(req.cookies);
  res.send("This is a cookies test");
});

/*POST home page. */
router.post("/add", function (req, res, next) {
  // let a = req.body["a"]
  // let b = req.body["b"]
  // let c = a+b

  number = 0;
  for (var key in req.body) {
    number += req.body[key];
  }
  res.send(`number: ${number}`);
});



// 中介軟體來解析 JSON 和 URL 編碼的表單數據
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// 渲染創建會員頁面
router.get("/create_member", function (req, res, next) {
  console.log("Rendering create_member page");
  res.render("create_member");
});

// 渲染購物車系統頁面
router.get("/shop_sys", function (req, res, next) {
  res.render("shop_sys");
});

// 查詢會員
router.get("/search_member", function (req, res, next) {
  
  // 寫入到json >> public/data/data.json
  const newData = { user: 'xxx@gmail.com' };

  fs.writeFile(path.join(__dirname, '../public/data/data.json'), JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
  });

  fs.readFile(path.join(__dirname, '../public/data/data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    const jsonData = JSON.parse(data);
    res.render("search_member", jsonData);
  });
});


// 渲染創建會員頁面
router.get("/create_member", function (req, res, next) {
  console.log("Rendering create_member page");
  res.render("create_member");
});

///edit_member
// 渲染修改會員頁面
// 编辑会员页面的 GET 路由
router.get('/edit_member/:email', function (req, res, next) {
  const email = req.params.email;

  fs.readFile(path.join(__dirname, '../public/data/data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Internal Server Error');
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (err) {
      console.error('Error parsing JSON:', err);
      return res.status(500).send('Internal Server Error');
    }

    const member = jsonData.members.find(m => m.email === email);
    if (!member) {
      return res.status(404).send('未找到會員資料，請創建會員');
    }

    res.render('edit_member', {
      member: member,
      showAlert: false
    });
  });
});


///create_member
// 處理創建會員的表單提交
router.post("/create_member", function (req, res, next) {
  const memberData = req.body;

  fs.readFile(path.join(__dirname, '../public/data/data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('讀取文件時發生錯誤:', err);
      return res.status(500).send("內部伺服器錯誤");
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (err) {
      console.error('解析 JSON 時發生錯誤:', err);
      return res.status(500).send("內部伺服器錯誤");
    }

    // 確保 members 數組存在，如果不存在則初始化為空數組
    jsonData.members = jsonData.members || [];
    // 將新的會員數據添加到 members 數組中
    jsonData.members.push(memberData);

    // 將更新後的數據寫回 'public/data/data.json' 文件
    fs.writeFile(path.join(__dirname, '../public/data/data.json'), JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error('寫入文件時發生錯誤:', err);
        return res.status(500).send("內部伺服器錯誤");
      }

      console.log("Member created:", memberData.email);
      res.redirect("/create_member");
    });
  });
});

/// edit_member
// 處理修改會員的表單提交
router.post("/edit_member/:email", function (req, res, next) {
  const email = req.params.email;
  const updatedMemberData = req.body;

  fs.readFile(path.join(__dirname, '../public/data/data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send("Internal Server Error");
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (err) {
      console.error('Error parsing JSON:', err);
      return res.status(500).send("Internal Server Error");
    }

    const memberIndex = jsonData.members.findIndex(m => m.email === email);
    if (memberIndex === -1) {
      // 如果找不到相應的會員，則只顯示一條警告消息，而不執行重定向
      console.log("Member not found:", email);
      return res.status(404).send("未找到會員資料，請創建會員");
    }

    // Update member data
    jsonData.members[memberIndex] = updatedMemberData;

    fs.writeFile(path.join(__dirname, '../public/data/data.json'), JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send("Internal Server Error");
      }

      console.log("Member updated:", email);

      // 這裡沒有重定向，因為找到了相應的會員
      //return res.send("會員資料已更新");

      // 重新渲染页面并传递成功消息
      // res.render('edit_member', {
      //   member: updatedMemberData,
      //   successMessage: '會員資料已更新'
      // });

      res.render('edit_member', {
        member: updatedMemberData,
        showAlert: true
      });
    });
  });
});

// 渲染 shop_search 页面
router.get("/shop_search", function (req, res) {
  res.render("shop_search", { data: [] });
});

// 处理表单提交的 POST 请求
router.post("/shop_search", function (req, res) {
  const startDate = req.body['start-date'] ? new Date(req.body['start-date']) : null;
  const endDate = req.body['end-date'] ? new Date(req.body['end-date']) : null;
  const email = req.body.email;

  if (!startDate || !endDate || !email) {
    // 如果其中一个没有填写，返回错误消息并渲染空的数据
    return res.render("shop_search", { data: [], errorMessage: "請填寫日期或帳號" });
  }


  // 读取 shop_searchdata.json 文件
  fs.readFile(path.join(__dirname, '../public/data/shop_searchdata.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('读取文件错误:', err);
      return res.status(500).send("Internal Server Error");
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (err) {
      console.error('解析 JSON 错误:', err);
      return res.status(500).send("Internal Server Error");
    }

      // 过滤符合条件的数据
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

    res.render("shop_search", { data: filteredData, errorMessage: null });
  });
});




module.exports = router;
