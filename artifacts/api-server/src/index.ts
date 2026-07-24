import app from "./app";
import { logger } from "./lib/logger";

// جلب المنفذ من المتغيرات أو تعيين 8080 كمنفذ افتراضي
const rawPort = process.env["PORT"] || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.error(`Invalid PORT value: "${rawPort}", falling back to 8080`);
}

const finalPort = Number.isNaN(port) || port <= 0 ? 8080 : port;

// ربط السيرفر بـ '0.0.0.0' ضروري جداً لعمل Replit و Express بدون مشاكل
const server = app.listen(finalPort, "0.0.0.0", () => {
  logger.info(
    { port: finalPort },
    "Server successfully listening on http://0.0.0.0:" + finalPort,
  );
});

// التعامل مع أخطاء التشغيل والتعطل بشكل آمن
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception occurred");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
