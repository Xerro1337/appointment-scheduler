const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Appointment Scheduler API" });
});

app.get("/appointments", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM appointments ORDER BY id"
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/appointments", async (req, res) => {
    try {
        const { name, email, appointment_date } = req.body;

        if (!name || !email || !appointment_date) {
            return res.status(400).json({
                error: "Name, email and appointment date are required"
            });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({
                error: "Name must be at least 2 characters long"
            });
        }

        if (!email.includes("@")) {
            return res.status(400).json({
                error: "Invalid email address"
            });
        }

        const appointmentDate = new Date(appointment_date);
        const now = new Date();

        if (appointmentDate <= now) {
            return res.status(400).json({
                error: "Appointment date must be in the future"
            });
        }

        const result = await pool.query(
            `INSERT INTO appointments (name, email, appointment_date)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name.trim(), email.trim(), appointment_date]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.delete("/appointments/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "DELETE FROM appointments WHERE id = $1",
            [id]
        );

        res.json({ message: "Appointment deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.patch("/appointments/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await pool.query(
            `UPDATE appointments
             SET status = $1
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});