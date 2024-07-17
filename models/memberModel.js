const db = require('../db')

const createMember = async (memberData) => {
    const connection = await db.pool.getConnection();
    try {
        // 查詢 檢查 EMAIL 是否已存在
        const checkEmailSql = "SELECT COUNT(*) AS count FROM member2024 WHERE EMAIL = ?";
        const [rows] = await connection.execute(checkEmailSql, [memberData.email]);
        const emailExists = rows[0].count > 0;
        if (emailExists) {
            // 如果 EMAIL 已存在，返回錯誤
            throw new Error('Email already exists.');
        }

        // 插入資料到 member2024 表
        const sql = "INSERT INTO member2024 (EMAIL, NAME, SEX, COUNTRY, CITY, INTERESTS, NOTE) VALUES (?, ?, ?, ?, ?, ?, ?)";

        await connection.execute(sql, [
            memberData.email,
            memberData.name,
            memberData.sex,
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
    const connection = await db.pool.getConnection();
    let sql = 'SELECT * FROM member2024 WHERE 1 = 1';
    let params = [];
    // 檢查並擴展 SQL 查詢
    if (startDate) {
        sql += ' AND record_date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND record_date <= ?';
        params.push(endDate);
    }
    if (email) {
        sql += ' AND email LIKE ?';
        params.push(`%${email}%`);
    }
    if (country) {
        sql += ' AND COUNTRY = ?';
        params.push(country);
    }
    if (city) {
        sql += ' AND CITY = ?';
        params.push(city);
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
        [rows] = await connection.execute('SELECT * FROM member2024');
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
        const sql = `DELETE FROM member2024 WHERE EMAIL IN (${placeholders})`;
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
        const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);
        // 檢查是否找到了會員訊息
        if (rows.length === 0) {
            return { success: false, errorMessage: '未找到會員資料，請創建會員'};
        }
        await connection.execute(
            'UPDATE member2024 SET NAME = ?, COUNTRY = ?, CITY = ?, SEX = ?, NOTE = ?, RECORD_DATE = ? WHERE EMAIL = ?',
            [updatedMemberData.name, updatedMemberData.select_country, updatedMemberData.select_city, updatedMemberData.sex, updatedMemberData.note, updatedMemberData.record_date, email]
        );
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
        const [rows] = await connection.execute('SELECT * FROM member2024 WHERE EMAIL = ?', [email]);
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
    const connection = await db.pool.getConnection();
    try {

        const checkEmailSql = "SELECT COUNT(*) AS count FROM member2024 WHERE EMAIL = ?";
        const [rows] = await connection.execute(checkEmailSql, [email]);

        if (rows[0].count > 0) {
            // 更新購物車資料
            const updateSql = `
                UPDATE member2024
                SET ORDER_DATE = ?,
                    SERIAL_NUMBER = ?,
                    PURCHASED_ITEMS = ?
                WHERE EMAIL = ?`;
            await connection.execute(updateSql, [orderDate, serialNumber, purchasedItems, email]);
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


module.exports = {
    createMember,
    searchMember,
    searchMemberPage,
    deleteMember,
    editMember,
    editMemberPage,
    shopSubmit
};
