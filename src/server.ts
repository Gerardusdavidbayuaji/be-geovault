import app from "./app";
import pool from "./config/db";

const PORT = process.env.PORT;

pool
  .connect()
  .then(() => {
    console.log("Berhasil terhubung ke Database");
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((err) => console.error("Database connection error:", err));
