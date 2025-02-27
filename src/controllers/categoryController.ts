import pool from "../config/db";

export const getAllData = async (query: string, res: any) => {
  try {
    const result = await pool.query(query);

    res.status(200).json({
      status: "Berhasil",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "Gagal",
      message: "Gagal mengambil data",
    });
  }
};
