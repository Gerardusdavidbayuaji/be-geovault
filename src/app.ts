import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import categoryRoutes from "./routes/categoryRoutes";
import uploadRoutes from "./routes/uploadRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", categoryRoutes);
app.use("/api", uploadRoutes);

export default app;
