import { Router } from "express";
import pool from "../config/db";

const router = Router();

router.get("/balai", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM balai ORDER BY nama_balai ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data balai" });
  }
});

router.get("/bulan", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bulan ORDER BY nama_bulan ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data bulan" });
  }
});

router.get("/tahun", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tahun ORDER BY nama_tahun ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data tahun" });
  }
});

router.get("/datas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM uploads ORDER BY uploaded_at ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil semua data" });
  }
});

export default router;
