import { Router, Request, Response, NextFunction } from "express";
import upload from "../middlewares/uploads";
import pool from "../config/db";

import unzipper from "unzipper";
import axios from "axios";
import path from "path";
import fs from "fs";

const router = Router();

const GEOSERVER_URL = process.env.GEOSERVER_URL;
const GEOSERVER_USER = process.env.GEOSERVER_USER;
const GEOSERVER_PASSWORD = process.env.GEOSERVER_PASSWORD;
const WORKSPACE = "geovault";

async function uploadToGeoserver(filePath: string, storeName: string) {
  const absolutePath = path.resolve(filePath).replace(/\\/g, "/");
  const url = `${GEOSERVER_URL}/rest/workspaces/${WORKSPACE}/datastores/${storeName}/external.shp`;

  try {
    const response = await axios.put(url, `file://${absolutePath}`, {
      auth: {
        username: GEOSERVER_USER as string,
        password: GEOSERVER_PASSWORD as string,
      },
      headers: { "Content-Type": "text/plain" },
    });

    if (response.status === 200 || response.status === 201) {
      const wfsJsonUrl = `${GEOSERVER_URL}/${WORKSPACE}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${WORKSPACE}:${storeName}&outputFormat=application/json`;
      const wfsShpUrl = `${GEOSERVER_URL}/${WORKSPACE}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${WORKSPACE}:${storeName}&outputFormat=SHAPE-ZIP`;
      return { wfsJsonUrl, wfsShpUrl };
    } else {
      console.error(
        `Failed to upload ${filePath} to GeoServer. Status: ${response.status}`
      );
      return null;
    }
  } catch (error: any) {
    console.error(
      "Error uploading to GeoServer:",
      error.response?.data || error.message
    );
    return null;
  }
}

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

      if (!kode_balai || !kode_bulan || !kode_tahun) {
        res
          .status(400)
          .json({ error: "Semua field (balai, bulan, tahun) harus diisi." });
        return;
      }

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
      const storeName = path.parse(shpFile).name;

      const urls = await uploadToGeoserver(shpFilePath, storeName);
      if (!urls) {
        res.status(500).json({ error: "Gagal mengunggah SHP ke GeoServer." });
        return;
      }

      const insertQuery = `
      INSERT INTO uploads (file_name, kode_balai, kode_bulan, kode_tahun, uploaded_at, wfs, download)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING *;
    `;

      const result = await pool.query(insertQuery, [
        shpFile,
        kode_balai,
        kode_bulan,
        kode_tahun,
        urls.wfsJsonUrl,
        urls.wfsShpUrl,
      ]);

      res.json({
        message: "File SHP berhasil diunggah dan dipublikasi ke GeoServer.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error saat mengekstrak file:", error);
      next(error);
    }
  }
);

export default router;
