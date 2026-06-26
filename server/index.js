require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const APPOINTMENT_SLOTS = {
    1: "09:00–12:00",
    2: "13:00–16:00",
    3: "17:00–20:00"
};

app.post("/login", (req, res) => {
    const { login, password } = req.body;

    if (
        login === process.env.ADMIN_LOGIN &&
        password === process.env.ADMIN_PASSWORD
    ) {
        return res.json({
            success: true
        });
    }

    res.status(401).json({
        success: false,
        error: "Invalid login or password"
    });
});

app.get("/", (req, res) => {
    res.json({ message: "Appointment Scheduler API" });
});

app.get("/appointments", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM appointments
            ORDER BY appointment_date, appointment_slot
            `
        );

        const appointments = result.rows.map((appointment) => ({
            ...appointment,
            appointment_date: appointment.appointment_date.toISOString().split("T")[0],
            slot_text: APPOINTMENT_SLOTS[appointment.appointment_slot]
        }));

        res.json(appointments);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.get("/appointments/available-slots", async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                error: "Date is required"
            });
        }

        const result = await pool.query(
            `
            SELECT appointment_slot
            FROM appointments
            WHERE appointment_date = $1
            `,
            [date]
        );

        const bookedSlots = result.rows.map((row) => row.appointment_slot);

        const availableSlots = [];

        for (let slot = 1; slot <= 3; slot++) {
            if (!bookedSlots.includes(slot)) {
                availableSlots.push({
                    id: slot,
                    text: APPOINTMENT_SLOTS[slot]
                });
            }
        }

        res.json({
            date,
            bookedSlots,
            availableSlots
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/appointments", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            appointment_date,
            appointment_slot
        } = req.body;

        if (
            !name ||
            !email ||
            !appointment_date ||
            appointment_slot === undefined
        ) {
            return res.status(400).json({
                error: "Please fill in all required fields"
            });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({
                error: "Name must be at least 2 characters long"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email address"
            });
        }

        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (phone && !phoneRegex.test(phone.trim())) {
            return res.status(400).json({
                error: "Invalid phone number"
            });
        }

        if (![1, 2, 3].includes(Number(appointment_slot))) {
            return res.status(400).json({
                error: "Invalid appointment slot"
            });
        }

        const slotExists = await pool.query(
            `
            SELECT id
            FROM appointments
            WHERE appointment_date = $1
            AND appointment_slot = $2
            `,
            [appointment_date, appointment_slot]
        );

        if (slotExists.rows.length > 0) {
            return res.status(409).json({
                error: "This slot has already been booked"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO appointments
            (
                name,
                email,
                phone,
                appointment_date,
                appointment_slot
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                name.trim(),
                email.trim(),
                phone?.trim() || null,
                appointment_date,
                appointment_slot
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
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