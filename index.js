import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./config.env" });

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
