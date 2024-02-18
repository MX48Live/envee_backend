import { Database } from "bun:sqlite";

export async function initialLogDB() {
  try {
    const db = new Database("logs/logs.sqlite", { create: true });
    db.exec("PRAGMA journal_mode = WAL;");

    // Create users table
    const logsTable = db.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        by TEXT,
        user_id INTEGER,
        message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logsTable.all();

    const userTable = db.query(` 
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    userTable.all();

    db.close();
    console.log("logs database created.");
  } catch (error) {
    console.log("Cannot create logs database.");
    console.log(error);
  }
}
