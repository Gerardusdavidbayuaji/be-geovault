import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import datasRoutes from "./routes/datasRoutes";
import uploadRoutes from "./routes/uploadRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", datasRoutes);
app.use("/api", uploadRoutes);

export default app;
