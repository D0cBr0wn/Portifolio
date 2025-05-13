import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty", // pour des logs jolis en dev
    options: {
      colorize: true,
    },
  },
});

export default logger;
