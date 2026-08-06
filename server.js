const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Frontend dosyalarını sunar

// Turso Veritabanı Bağlantısı
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// --- API ENDPOINTLERİ ---

// Tüm araçları getir
app.get('/api/cars', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM cars");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Yeni araç ekle / Güncelle / Kirala
app.post('/api/cars/save', async (req, res) => {
    const cars = req.body;
    try {
        await db.execute("DELETE FROM cars"); // Önce eski listeyi temizle, güncel listeyi yaz
        for (let car of cars) {
            await db.execute({
                sql: `INSERT INTO cars (id, plate, brand, model, km, status, rentDate, expectedReturnDate, renterName, employeeName, dailyPrice, startKm) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    car.id, car.plate, car.brand, car.model, car.km, car.status, 
                    car.rentDate, car.expectedReturnDate, car.renterName, 
                    car.employeeName, car.dailyPrice, car.startKm
                ]
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tahsilat geçmişini getir
app.get('/api/revenue', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM revenue");
        let revenueData = {};
        result.rows.forEach(row => {
            revenueData[row.monthKey] = {
                total: row.total,
                details: JSON.parse(row.details)
            };
        });
        res.json(revenueData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tahsilat geçmişini kaydet
app.post('/api/revenue/save', async (req, res) => {
    const revenueData = req.body;
    try {
        await db.execute("DELETE FROM revenue");
        for (let key of Object.keys(revenueData)) {
            const monthData = revenueData[key];
            await db.execute({
                sql: `INSERT INTO revenue (monthKey, total, details) VALUES (?, ?, ?)`,
                args: [key, monthData.total, JSON.stringify(monthData.details)]
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor.`);
});