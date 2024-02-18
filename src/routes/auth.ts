import { Hono } from "hono";
import { setSignedCookie, getSignedCookie } from "hono/cookie";

import { http } from "../utils/httpResponse";
import { Auth } from "../models/auth";
import writeLog from "../utils/logger";

const app = new Hono();

// -- /auth
app.post("/signin", async (context) => {
  const { username, password } = await context.req.json();
  if (!username || !password) {
    context.status(http.Unauthorized);
    writeLog({
      level: "warn",
      by: "auth",
      message: `${username} failed to sign-in, status: ${http.Unauthorized}`,
    });
    return context.json({
      status: http.Unauthorized,
      message: "Invalid credential",
    });
  }

  const result = await Auth.signin(username, password);
  if (result.status == http.Ok) {
    context.status(http.Ok);
    writeLog({
      level: "info",
      by: "auth",
      message: `${username} signed-in`,
    });
    await setSignedCookie(
      context,
      "data",
      JSON.stringify(result.cookie),
      process.env.COOKIE_SECERT as string,
      {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(new Date().setUTCDate(new Date().getUTCDate() + 7)), // 7 days
      }
    );
    return context.json({
      status: http.Ok,
      data: result.data,
      message: "User signed in",
    });
  }
  if (result.status == http.Unauthorized) {
    context.status(http.Unauthorized);
    writeLog({
      level: "warn",
      by: "auth",
      message: `${username} failed to sign-in, status: ${http.Unauthorized}`,
    });
    return context.json({
      status: http.Unauthorized,
      message: "Invalid credential",
    });
  }
  if (result.status == http.InternalSeverError) {
    context.status(http.InternalSeverError);
    writeLog({
      level: "warn",
      by: "auth",
      message: `${username} failed to sign-in, status: ${http.InternalSeverError}`,
    });
    return context.json({
      status: http.InternalSeverError,
      message: "Internal server error",
    });
  }
});

app.get("/session", async (context) => {
  const requset_cookie = await getSignedCookie(
    context,
    process.env.COOKIE_SECERT as string,
    "data"
  );
  if (!requset_cookie) {
    context.status(http.Unauthorized);
    writeLog({
      level: "warn",
      by: "auth",
      message: `refresh session with no cookie, status: ${http.Unauthorized}`,
    });
    return context.json({
      status: http.Unauthorized,
      message: "Unauthorized",
    });
  }
  const cookie = JSON.parse(requset_cookie as string);
  if (!cookie.refresh_token) {
    context.status(http.Unauthorized);
    writeLog({
      level: "warn",
      by: "auth",
      message: `refresh session with no refresh_token, status: ${http.Unauthorized}`,
    });
    return context.json({
      status: http.Unauthorized,
      message: "Unauthorized",
    });
  }
  const result = await Auth.getSession(cookie.refresh_token);
  if (result.status == http.Ok) {
    context.status(http.Ok);
    writeLog({
      level: "info",
      by: "auth",
      user_id: result.data?.user.id,
      message: `refresh access token with refresh token`,
    });
    return context.json({
      status: http.Ok,
      data: result.data,
      message: "session found",
    });
  }
  if (result.status == http.Unauthorized) {
    context.status(http.Unauthorized);
    writeLog({
      level: "warn",
      by: "auth",
      message: `refresh session with invalid refresh token, status: ${http.Unauthorized}`,
    });
    return context.json({
      status: http.Unauthorized,
      message: "Unauthorized",
    });
  }
  if (result.status == http.InternalSeverError) {
    context.status(http.InternalSeverError);
    writeLog({
      level: "warn",
      by: "auth",
      message: `refresh session with internal server error, status: ${http.InternalSeverError}`,
    });
    return context.json({
      status: http.InternalSeverError,
      message: "Internal server error",
    });
  }
});

export default app;
