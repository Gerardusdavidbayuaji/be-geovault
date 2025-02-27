import { Router } from "express";
import {
  getAllDataByUploaded,
  deleteById,
  updateById,
  getBulan,
  getTahun,
  getBalai,
} from "../controllers/datasController";

const router = Router();

router.get("/balai", getBalai);
router.get("/bulan", getBulan);
router.get("/tahun", getTahun);

router.get("/all-data", getAllDataByUploaded);
router.delete("/data/:id", deleteById);
router.patch("/data/:id", updateById);

export default router;
