import chalk, { ChalkInstance } from "chalk";
import { Database } from "bun:sqlite";

export type OptionType = {
  level: LogLevels;
  by: string;
  user_id?: number | null;
  message: string;
};

export type LogType = OptionType & {
  id: number;
  created_at: string;
};

const levelColors = {
  info: "cyanBright",
  warn: "yellow",
  error: "red",
  fatal: "bgRed",
  debug: "magenta",
  trace: "cyan",
};

type LogLevels = "info" | "warn" | "error" | "fatal" | "debug" | "trace";

export default async function writeLog(option: OptionType) {
  try {
    const { level, by = null, user_id = null, message } = option;
    const db_log = new Database("logs/logs.sqlite");
    const log = db_log.query(
      "INSERT INTO logs (level, by, user_id, message) VALUES (?1, ?2, ?3, ?4) RETURNING *;"
    );
    const result = log.get(level, by, user_id, message) as LogType;
    log.finalize();

    if (!result.id) {
      console.log(chalk.red("Failed to write log to database"));
      return;
    }

    db_log.close();

    const opt = {
      id: result.id,
      level: result.level,
      by: result.by,
      user_id: result.user_id,
      message: result.message,
    } as LogType;

    printLog(opt);
  } catch (error) {
    console.log(chalk.red("Failed to write log to database"));
    console.log(error);
  }
}

function printLog(option: LogType) {
  const { id, level, by, user_id, message } = option;
  console.log(
    `(${id}) ` +
      // @ts-ignore
      chalk[levelColors[level]](`${level.toUpperCase()}` + ` | `) +
      `${by} ` +
      (user_id ? `(UID ${user_id}) ` : "") +
      `-> ${message}`
  );
}
