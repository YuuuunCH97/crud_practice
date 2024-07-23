const { json } = require('body-parser');
const db = require('../db')

const createMember = async (memberData) => {
    const connection = await db.pool.getConnection();
    try {
        // 查詢 檢查 EMAIL 是否已存在
        const checkEmailSql = "SELECT COUNT(*) AS count FROM members WHERE EMAIL = ?";
        const [rows] = await connection.execute(checkEmailSql, [memberData.email]);
        const emailExists = rows[0].count > 0;
        if (emailExists) {
            // 如果 EMAIL 已存在，返回錯誤
            throw new Error('Email already exists.');
        }

        // 插入資料到 member2024 表
        // const sql = "INSERT INTO member2024 (EMAIL, NAME, SEX, COUNTRY, CITY, INTERESTS, NOTE) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const sql = `
            INSERT INTO member_data.members
            (EMAIL, SEX, NAME, COUNTRY, CITY, INTERESTS, NOTE)
            VALUES(?, ?, ?, ?, ?, ?, ?);
            `
        await connection.execute(sql, [
            memberData.email,
            memberData.sex,
            memberData.name,
            memberData.select_country,
            memberData.select_city,
            JSON.stringify(memberData.interests) || null, // 將興趣轉為 JSON 字串存儲
            memberData.note || null,
        ]);
        return { success: true };
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const searchMember = async (startDate, endDate, email, country, city, id=null, Skil=null) => {
    // TODO 新增 id Skil 搜尋
    // TODO 網頁查詢 頁面重新載入後 回填查詢輸入值 與無結果的alart
    // TODO 可以與searchMemberPage合併
    const connection = await db.pool.getConnection();
    let sql = 'SELECT * FROM members WHERE 1 = 1';
    let params = [];
    // 檢查並擴展 SQL 查詢
    if (startDate) {
        sql += ` AND record_date >= '${startDate}'`;
    }
    if (endDate) {
        sql += ` AND record_date <= '${endDate}'`;
    }
    if (email) {
        sql += ` AND email LIKE '%${email}%'`;
    }
    if (country) {
        sql += ` AND COUNTRY = '${country}'`;
    }
    if (city) {
        sql += ` AND CITY = '${city}'`;
    }
    try {
        const [rows] = await connection.execute(sql, params);
        const errorMessage = rows.length === 0
        ? '找不到符合條件的會員'
        : null;
        return { success: true, data: rows, errorMessage };
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const searchMemberPage = async () => {
    const connection = await db.pool.getConnection();
    try {
        [rows] = await connection.execute('SELECT * FROM members');
        return { success: true , data: rows, errorMessage: null};
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const deleteMember = async (placeholders, selectedEmails) => {
    const connection = await db.pool.getConnection();
    try {
        const sql = `DELETE FROM members WHERE EMAIL IN (${placeholders})`;
        await connection.execute(sql, selectedEmails);
        return { success: true, errorMessage: null};
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const editMember = async (email, updatedMemberData) => {
    const connection = await db.pool.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT * FROM members WHERE EMAIL = '${email}'`);
        // 檢查是否找到了會員訊息
        if (rows.length === 0) {
            return { success: false, errorMessage: '未找到會員資料，請創建會員'};
        }
        await connection.execute(`UPDATE members
            SET NAME = '${updatedMemberData.name}', COUNTRY = '${updatedMemberData.select_country}', CITY = '${updatedMemberData.select_city}',
            SEX = '${updatedMemberData.sex}', NOTE = '${updatedMemberData.note}', RECORD_DATE = '${updatedMemberData.record_date}' WHERE EMAIL = '${email}'`);
        return { success: true, errorMessage: null};
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const editMemberPage = async (email) => {
    const connection = await db.pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM members WHERE EMAIL = ?', [email]);
        if (rows.length === 0) {
            return { success: false, errorMessage: '未找到會員資料，請創建會員'};
        }
        const member = rows[0];
        member.INTERESTS === null
        ? member.INTERESTS = []
        : member.INTERESTS = JSON.parse(member.INTERESTS)
        return { success: true, member: member, errorMessage:null, msg: "" }
    } catch (err) {
        console.log(err);
        throw err;
    } finally {
        connection.release();
    }
}

const shopSubmit = async (orderDate, serialNumber, email, purchasedItems) => {
    // 新增訂單
    const connection = await db.pool.getConnection();
    try {
        const checkEmailSql = `
        SELECT ID FROM member_data.members
        where EMAIL = '${email}';
        `;
        const [rows] = await connection.execute(checkEmailSql);
        if (rows.length > 0) {
            const member = rows[0]
            console.log(member.ID);
            // 更新購物車資料
            const updateSql = `
                INSERT INTO member_data.orders
                (MEMBER_ID, SERIAL_NUMBER, PURCHASED_ITEMS)
                VALUES(${member.ID}, '${serialNumber}', '${JSON.stringify(purchasedItems)}');`;
                console.log(updateSql);
            await connection.execute(updateSql);
            return { success: true, errorMessage:"購物車資料已更新" }
        } else {
            return { success: true, errorMessage:"無會員資料，無法新增購物車資料" }
        }
    } catch (err) {
        console.log(err);
        throw err;
    } finally {
        connection.release();
    }
}

const shopSearchPage = async (startDate, endDate, email) => {
    const connection = await db.pool.getConnection();
    try {
        // let query = "SELECT ORDER_DATE, SERIAL_NUMBER, EMAIL, PURCHASED_ITEMS FROM orders WHERE 1=1";

        let query = `
            SELECT
                m.ID AS MemberID,
                m.EMAIL,
                m.NAME,
                o.ID AS ORDER_ID,
                o.SERIAL_NUMBER,
                o.ORDER_DATE,
                o.PURCHASED_ITEMS
            FROM
                members m
            JOIN
                orders o
            ON
                m.ID = o.MEMBER_ID
            WHERE 1=1`;
        // 如果有過濾條件，則添加到查詢中
        if (startDate){
            query += ` AND DATE(o.ORDER_DATE) >= '${startDate}'`;
        }
        if (endDate){
            query += ` AND DATE(o.ORDER_DATE) <= '${endDate}'`;
        }
        if (email){
            query += ` AND m.EMAIL = '${email}'`;
        }
        console.log(query);
        const [rows] = await connection.execute(query);

        return { success: true, data: rows, startDate, endDate, email };
    } catch (err) {
        console.log(err);
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = {
    createMember,
    searchMember,
    searchMemberPage,
    deleteMember,
    editMember,
    editMemberPage,
    shopSubmit,
    shopSearchPage
};
