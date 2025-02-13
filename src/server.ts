import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import selectRoutes from "./routes/selectRoutes";
import uploadRoutes from "./routes/uploadRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", selectRoutes);
app.use("/api", uploadRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

export default app;
