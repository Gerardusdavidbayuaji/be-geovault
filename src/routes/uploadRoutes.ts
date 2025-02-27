import { Router } from "express";
import upload from "../middlewares/uploads";
import { uploadDataHandler } from "../controllers/uploadController";

const router = Router();

router.post("/upload", upload.single("file"), (req, res, next) => {
  uploadDataHandler(req, res, next).catch(next);
});

export default router;
