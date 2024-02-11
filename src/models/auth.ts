import { UserType } from "./user";
import { Database } from "bun:sqlite";
import { http } from "../utils/httpResponse";
import { decode, sign, verify } from "hono/jwt";

export type AuthType = {
  user_id: number;
  refresh_token: string;
  last_login: string;
};

export type CookieType = {
  id: number;
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

      // Remove old login
      const removeLogin = db.query("DELETE FROM login WHERE user_id = ?1");
      removeLogin.run(user.id);
      removeLogin.finalize();

      // Create new refresh token
      const JWT_SECRET = process.env.JWT_TOKEN as string;
      const NEW_REFRESH_TOKEN = {
        id: user.id,
        iat: new Date(),
        nbf: new Date(),
        exp: new Date(new Date().setUTCDate(new Date().getUTCDate() + 7)), //7 Days
      };
      const refresh_token = await sign(NEW_REFRESH_TOKEN, JWT_SECRET);

      // create new access token
      const NEW_ACCESS_TOKEN = {
        id: user.id,
        iat: new Date(),
        nbf: new Date(),
        exp: new Date(new Date().setUTCHours(new Date().getUTCHours() + 2)), //2 Hours
      };
      const access_token = await sign(NEW_ACCESS_TOKEN, JWT_SECRET);

      // Add new login
      const saveNewRefreshToken = db.query(
        "INSERT INTO login (user_id, refresh_token) VALUES (?1, ?2) RETURNING *"
      );
      const newLogin = saveNewRefreshToken.get(
        user.id,
        refresh_token
      ) as AuthType;
      saveNewRefreshToken.finalize();
      if (!newLogin) {
        db.close();
        return { status: http.InternalSeverError, data: undefined };
      }

      // Return user and token
      const response = {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
        } as UserType,
        access_token: access_token,
      };
      const set_cookie = {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
        } as UserType,
        refresh_token: refresh_token,
      };
      db.close();
      return { status: http.Ok, data: response, cookie: set_cookie };
    } catch (error) {
      console.log("Server Error: Could not create user");
      return { status: http.InternalSeverError, data: undefined };
    }
  },

  async getSession(refresh_token: string) {
    const SECRET = process.env.JWT_TOKEN as string;
    try {
      const decoded = (await verify(refresh_token, SECRET)) as CookieType;
      if (!decoded) return { status: http.Unauthorized };

      // IF token is valid, check if user is logged in
      const db = new Database("database/db.sqlite");
      const checkLogin = db.query("SELECT * FROM login WHERE user_id = ?1");
      const loggedIn = checkLogin.get(decoded.id) as AuthType;
      checkLogin.finalize();
      if (!loggedIn.user_id) {
        db.close();
        console.log("User Not Found");
        return { status: http.Unauthorized };
      }

      // Check if token is valid
      if (loggedIn.refresh_token != refresh_token) {
        db.close();
        console.log("Token not match");
        return { status: http.Unauthorized };
      }

      // Get user Info to response back again.
      const user = db.query("SELECT * FROM users WHERE id = ?1");
      const userInfo = user.get(loggedIn.user_id) as UserType;
      user.finalize();
      if (!userInfo) {
        db.close();
        return { status: http.InternalSeverError };
      }

      // Set Cookie also return session
      const NEW_ACCESS_TK = {
        id: userInfo.id,
        iat: new Date(),
        nbf: new Date(),
        exp: new Date(new Date().setUTCHours(new Date().getUTCHours() + 2)), //2 Hours
      };
      const access_token = await sign(NEW_ACCESS_TK, SECRET);
      const response = {
        user: {
          id: userInfo.id,
          username: userInfo.username,
          display_name: userInfo.display_name,
        } as UserType,
        access_token: access_token,
      };
      db.close();
      return { status: http.Ok, data: response };
    } catch (error) {
      console.log("Server Error: cannot verify token", error);
      return { status: http.Unauthorized };
    }
  },
};
