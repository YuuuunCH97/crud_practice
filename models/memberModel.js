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

const allMember = async () => {
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

const del_members = async (placeholders, selectedEmails) => {
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


module.exports = {
    createMember,
    searchMember,
    allMember,
    del_members
};
