import pool from "../config/db";

export const getBalai = async (req: string, res: any) => {
  try {
    const result = await pool.query(
      "SELECT * FROM balai ORDER BY nama_balai ASC"
    );

    res.status(200).json({
      status: "Success",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "Gagal",
      message: "Gagal mengambil data",
    });
  }
};

export const getBulan = async (req: string, res: any) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bulan ORDER BY nama_bulan ASC"
    );

    res.status(200).json({
      status: "Success",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "Gagal",
      message: "Gagal mengambil data",
    });
  }
};

export const getTahun = async (req: string, res: any) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tahun ORDER BY nama_tahun ASC"
    );

    res.status(200).json({
      status: "Success",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "Gagal",
      message: "Gagal mengambil data",
    });
  }
};

export const getAllDataByUploaded = async (req: string, res: any) => {
  try {
    const result = await pool.query(
      "SELECT * FROM uploads ORDER BY uploaded_at ASC"
    );

    res.status(200).json({
      status: "Success",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "Gagal",
      message: "Gagal mengambil data",
    });
  }
};

export const deleteById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM uploads WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "Failed",
        message: "Data tidak ditemukan",
      });
    }
    res.status(200).json({
      status: "Success",
      message: "Berhasil menghapus data",
    });
  } catch (error) {
    res.status(500).json({
      status: "Gagal",
      message: "Gagal menghapus data",
    });
  }
};

export const updateById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { kode_balai, kode_bulan, kode_tahun } = req.body;

    const result = await pool.query(
      "UPDATE uploads SET kode_balai = $1, kode_bulan = $2, kode_tahun = $3 WHERE id = $4 RETURNING *",
      [kode_balai, kode_bulan, kode_tahun, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "Failed",
        message: "Data tidak ditemukan",
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Data berhasil diperbaharui",
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: "Gagal memperbaharui data",
    });
  }
};
