import { Router } from "express";
import { getAllData } from "../controllers/categoryController";

const router = Router();

router.get("/balai", (req, res) =>
  getAllData("SELECT * FROM balai ORDER BY nama_balai ASC", res)
);

router.get("/bulan", (req, res) =>
  getAllData("SELECT * FROM bulan ORDER BY nama_bulan ASC", res)
);

router.get("/tahun", (req, res) =>
  getAllData("SELECT * FROM tahun ORDER BY nama_tahun ASC", res)
);

router.get("/all-data", (req, res) =>
  getAllData("SELECT * FROM uploads ORDER BY uploaded_at ASC", res)
);

export default router;
