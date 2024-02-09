import { UserType } from "./user";
import { Database } from "bun:sqlite";
import { http } from "../utils/httpResponse";
import { sign } from "hono/jwt";

export type AuthType = {
  id: number;
  user_id: number;
  login_time: string;
};

export const Auth = {
  async signin(username: string, password: string) {
    try {
      const db = new Database("database/db.sqlite");
      // Check if user exists
      const checkUser = db.query("SELECT * FROM users WHERE username = ?1");

      const user = checkUser.get(username) as UserType;
      checkUser.finalize();
      if (!user) {
        db.close();
        return { status: http.Unauthorized, data: undefined };
      }

      // Check if password is correct
      const isMatch = await Bun.password.verify(password, user.password);

      if (!isMatch) {
        db.close();
        return { status: http.Unauthorized, data: undefined };
      }

      // Check if user is already logged in
      const checkLogin = db.query("SELECT * FROM login WHERE user_id = ?1");
      const loggedIn = checkLogin.get(user.id) as AuthType;
      checkLogin.finalize();
      if (loggedIn) {
        // Remove previous login
        const removeLogin = db.query("DELETE FROM login WHERE id = ?1");
        removeLogin.run(loggedIn.id);
        checkLogin.finalize();
      }
      // Add new login
      const updateLoginTime = db.query(
        "INSERT INTO login (user_id) VALUES (?1) RETURNING *"
      );
      const newLogin = updateLoginTime.get(user.id) as AuthType;
      updateLoginTime.finalize();
      if (!newLogin) {
        db.close();
        return { status: http.InternalSeverError, data: undefined };
      }
      // Create JWT token
      const SECRET = process.env.JWT_TOKEN as string;
      const PAYLOAD = {
        id: user.id,
        role: user.role,
        iat: Date.now(),
        nbf: Date.now(),
        exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
      };
      const token = await sign(PAYLOAD, SECRET);

      // Return user and token
      const response = {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
        } as UserType,
        token: token,
      };
      db.close();
      return { status: http.Ok, data: response };
    } catch (error) {
      console.log("Server Error: Could not create user");
      return { status: http.InternalSeverError, data: undefined };
    }
  },
};
