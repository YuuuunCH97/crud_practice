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

const searchMember = async (startDate, endDate, email, country, city, id, Skil) => {
    // TODO
    const connection = await db.pool.getConnection();
    try {
        let rows = []
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


module.exports = {
    createMember,
    searchMember,
    allMember
};
