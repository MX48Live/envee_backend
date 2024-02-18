import { Hono } from "hono";
import { http } from "../utils/httpResponse";
import { User } from "../models/user";
import writeLog from "../utils/logger";

const app = new Hono();

// -- /users
app.post("/add", async (context) => {
  const { username, password, display_name } = await context.req.json();
  const result = await User.create(username, password, display_name);
  if (result == http.Created) {
    context.status(http.Created);
    writeLog({
      level: "info",
      by: "users",
      message: `${username} created a new account`,
    });
    return context.json({
      status: http.Created,
      message: "User created",
    });
  }
  if (result == http.AlreadyExists) {
    context.status(http.AlreadyExists);
    writeLog({
      level: "info",
      by: "users",
      message: `${username} failed to create a new account, status: ${http.AlreadyExists}`,
    });
    return context.json({
      status: http.AlreadyExists,
      message: "User already exists",
    });
  }
  context.status(http.InternalSeverError);
  writeLog({
    level: "error",
    by: "users",
    message: `Server Error: Could not create user`,
  });
  return context.json({
    status: http.InternalSeverError,
    message: "Server Error: Could not create user",
  });
});

export default app;
