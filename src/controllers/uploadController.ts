import { Request, Response, NextFunction } from "express";

import pool from "../config/db";

import unzipper from "unzipper";
import axios from "axios";
import path from "path";
import fs from "fs";

const {
  GEOSERVER_URL,
  GEOSERVER_USER,
  GEOSERVER_PASSWORD,
  GEOSERVER_WORKSPACE,
} = process.env;

export const uploadToGeoserver = async (
  filePath: string,
  storeName: string
) => {
  try {
    const response = await axios.put(
      `${GEOSERVER_URL}/rest/workspaces/${GEOSERVER_WORKSPACE}/datastores/${storeName}/external.shp`,
      `file://${path.resolve(filePath).replace(/\\/g, "/")}`,
      {
        auth: {
          username: GEOSERVER_USER as string,
          password: GEOSERVER_PASSWORD as string,
        },
        headers: { "Content-Type": "text/plain" },
      }
    );

    if (response.status === 200 || response.status === 201) {
      return {
        wfsJsonUrl: `${GEOSERVER_URL}/${GEOSERVER_WORKSPACE}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${GEOSERVER_WORKSPACE}:${storeName}&outputFormat=application/json`,
        wfsShpUrl: `${GEOSERVER_URL}/${GEOSERVER_WORKSPACE}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${GEOSERVER_WORKSPACE}:${storeName}&outputFormat=SHAPE-ZIP`,
      };
    }
  } catch (error: any) {
    console.error(
      "Pengunggahan file .shp ke GeoServer gagal",
      error.response?.data || error.message
    );
  }
};

export const extractionFileUpload = async (
  filePath: string,
  extractPath: string
) => {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on("close", resolve)
      .on("error", reject);
  });
};

export const updateData = async (
  shpFile: string,
  kode_balai: string,
  kode_bulan: string,
  kode_tahun: string,
  urls: { wfsJsonUrl: string; wfsShpUrl: string }
) => {
  const result = await pool.query(
    `INSERT INTO uploads (file_name, kode_balai, kode_bulan, kode_tahun, uploaded_at, wfs, download) 
        VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING *;`,
    [
      shpFile,
      kode_balai,
      kode_bulan,
      kode_tahun,
      urls.wfsJsonUrl,
      urls.wfsShpUrl,
    ]
  );

  return result.rows[0];
};

export const uploadDataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({
        status: "Failed",
        message:
          "File tidak valid, gunakan .zip yang berisikan (.shp, .shx .dbf .prj)",
      });
    }

    const { kode_balai, kode_bulan, kode_tahun } = req.body;
    if (!kode_balai || !kode_bulan || !kode_tahun) {
      return res.status(400).json({
        status: "Failed",
        message: "Semua field harus diisi",
      });
    }

    const extractPath = `./src/repository/${path.parse(file.filename).name}`;
    await extractionFileUpload(file.path, extractPath);

    fs.unlinkSync(file.path);

    const vektorData = fs
      .readdirSync(extractPath)
      .find((f) => f.endsWith(".shp"));
    if (!vektorData) {
      return res.status(400).json({
        status: "Failed",
        message: "File format .shp tidak ditemukan",
      });
    }

    const urlGeoseerver = await uploadToGeoserver(
      path.join(extractPath, vektorData),
      path.parse(vektorData).name
    );
    if (!urlGeoseerver) {
      return res.status(500).json({
        status: "Failed",
        message:
          "Pengunggahan file .shp ke GeoServer gagal. Silakan coba unggah ulang",
      });
    }

    const nameData = path.parse(vektorData).name;

    const uploadData = await updateData(
      nameData,
      kode_balai,
      kode_bulan,
      kode_tahun,
      urlGeoseerver
    );

    res.status(200).json({
      status: "Success",
      message: "Berhasil diunggah ke Geoserver",
      data: uploadData,
    });
  } catch (error) {
    console.error("Silahkan coba unggah ulang", error);
    next(error);
  }
};
