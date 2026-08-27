const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDB() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS cars (
                id TEXT PRIMARY KEY,
                plate TEXT,
                brand TEXT,
                model TEXT,
                km INTEGER,
                status TEXT,
                rentDate TEXT,
                expectedReturnDate TEXT,
                renterName TEXT,
                employeeName TEXT,
                dailyPrice INTEGER,
                startKm INTEGER,
                notes TEXT
            )
        `);
        try {
            await db.execute(`ALTER TABLE cars ADD COLUMN notes TEXT`);
        } catch (e) {}

        await db.execute(`
            CREATE TABLE IF NOT EXISTS revenue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                monthKey TEXT,
                total INTEGER,
                details TEXT
            )
        `);
    } catch (err) {
        console.error("Tablo oluşturma hatası:", err);
    }
}
initDB();

app.get('/api/cars', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM cars");
        res.json(result.rows || []);
    } catch (err) {
        console.error("Araçları getirme hatası:", err.message);
        res.json([]);
    }
});

app.post('/api/cars/save', async (req, res) => {
    const cars = req.body;
    try {
        await db.execute("DELETE FROM cars");
        if (Array.isArray(cars)) {
            for (let car of cars) {
                await db.execute({
                    sql: `INSERT INTO cars (id, plate, brand, model, km, status, rentDate, expectedReturnDate, renterName, employeeName, dailyPrice, startKm, notes) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        car.id || '',
                        car.plate || '',
                        car.brand || '',
                        car.model || '',
                        car.km || 0,
                        car.status || 'available',
                        car.rentDate || null,
                        car.expectedReturnDate || null,
                        car.renterName || null,
                        car.employeeName || null,
                        car.dailyPrice || null,
                        car.startKm || null,
                        car.notes || ''
                    ]
                });
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error("SQL Kayıt Hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/revenue', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM revenue");
        let revenueData = {};
        const rows = result.rows || [];
        rows.forEach(row => {
            revenueData[row.monthKey] = {
                total: row.total,
                details: JSON.parse(row.details || '[]')
            };
        });
        res.json(revenueData);
    } catch (err) {
        console.error("Tahsilat getirme hatası:", err.message);
        res.json({});
    }
});

app.post('/api/revenue/save', async (req, res) => {
    const revenueData = req.body;
    try {
        await db.execute("DELETE FROM revenue");
        for (let key of Object.keys(revenueData)) {
            const monthData = revenueData[key];
            await db.execute({
                sql: `INSERT INTO revenue (monthKey, total, details) VALUES (?, ?, ?)`,
                args: [key, monthData.total, JSON.stringify(monthData.details || [])]
            });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Tahsilat kayıt hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor.`);
});