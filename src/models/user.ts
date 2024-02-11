import { Database } from "bun:sqlite";
import { http } from "../utils/httpResponse";

export type UserType = {
  id: number;
  username: string;
  password: string;
  display_name: string;
  created_at: string;
};

export const User = {
  async create(username: string, password: string, display_name: string) {
    try {
      const db = new Database("database/db.sqlite");
      const checkUser = db.query("SELECT * FROM users WHERE username = ?1");
      const userExists = checkUser.all(username);
      checkUser.finalize();
      if (userExists.length > 0) {
        db.close();
        return http.AlreadyExists;
      }
      const user = db.query(
        "INSERT INTO users (username, password, display_name) VALUES (?1, ?2, ?3)"
      );
      const hashedPassword = await Bun.password.hash(password);
      const result = user.all(username, hashedPassword, display_name);
      user.finalize();
      if (!result) {
        db.close();
        console.log("Server Error: Could not create user");
        return http.InternalSeverError;
      }
      db.close();
      console.log("created user", username);
      return http.Created;
    } catch (error) {
      console.log("Server Error: Could not create user");
      return http.InternalSeverError;
    }
  },
};
