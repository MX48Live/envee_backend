import { Database } from "bun:sqlite";

export async function initialDatabse() {
  try {
    const db = new Database("database/db.sqlite", { create: true });
    db.exec("PRAGMA journal_mode = WAL;");

    // Create users table
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

    // create Login table
    const loginTable = db.query(`
      CREATE TABLE IF NOT EXISTS login (
        user_id INTEGER PRIMARY KEY,
        last_login TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        refresh_token TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    loginTable.all();

    db.close();
    console.log("Database created.");
  } catch (error) {
    console.log("Cannot create database.");
    console.log(error);
  }
}
