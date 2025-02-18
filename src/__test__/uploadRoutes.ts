import { Router, Request, Response, NextFunction } from "express";
import { exec } from "child_process";
import unzipper from "unzipper";
import util from "util";
import path from "path";
import fs from "fs";

import upload from "../middlewares/uploads";
import pool from "../config/db";

const execPromise = util.promisify(exec);
const router = Router();

router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file as Express.Multer.File;

      if (!file || !file.path || !file.filename) {
        res
          .status(400)
          .json({ error: "File tidak ditemukan atau tidak valid" });
        return;
      }

      const kode_balai = req.body.kode_balai || "abc1152";
      const kode_bulan = req.body.kode_bulan || "abc4251";
      const kode_tahun = req.body.kode_tahun || "abc2387";

      const zipFilePath = file.path;
      const extractPath = `./src/repository/${path.parse(file.filename).name}`;

      // Tunggu hingga ZIP selesai diekstrak
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(zipFilePath)
          .pipe(unzipper.Extract({ path: extractPath }))
          .on("close", resolve)
          .on("error", reject);
      });

      console.log("File berhasil diekstrak.");

      // Cari file SHP dalam folder hasil ekstraksi
      const files = fs.readdirSync(extractPath);
      const shpFile = files.find((file) => file.endsWith(".shp"));
      console.log("data .shp yang diupload", shpFile);

      if (!shpFile) {
        res.status(400).json({ error: "File SHP tidak ditemukan dalam ZIP" });
        return;
      }

      const shpFilePath = path.join(extractPath, shpFile);
      const tableName = "uploads";

      const shp2pgsqlCommand = `
        shp2pgsql -I -s 4326 -W "UTF-8" ${shpFilePath} public.${tableName}
      `;

      try {
        const { stdout } = await execPromise(shp2pgsqlCommand);

        await pool.query(stdout);
        // await execPromise(ogr2ogrCommand);
        console.log("SHP berhasil diimpor ke PostgreSQL.");

        const insertQuery = `
          INSERT INTO uploads (file_name, kode_balai, kode_bulan, kode_tahun, uploaded_at)
          VALUES ($1, $2, $3, $4, NOW()) RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
          shpFile,
          kode_balai,
          kode_bulan,
          kode_tahun,
        ]);

        res.json({
          message: "File SHP berhasil diunggah dan diimpor.",
          data: result.rows[0],
        });
      } catch (error) {
        console.error("Error saat mengimpor SHP:", error);
        next(error);
      }
    } catch (error) {
      console.error("Error saat mengekstrak file:", error);
      next(error);
    }
  }
);

export default router;
