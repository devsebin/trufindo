import validateEnv from "./utils/validate-env";
import dotenv from "dotenv";
import "module-alias/register";
import App from "./app";
dotenv.config();
validateEnv();

const app = new App(Number(process.env.PORT));
app.listen();
