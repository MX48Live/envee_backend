import { Hono } from "hono";
import { http } from "../utils/httpResponse";
import { User } from "../models/user";

const app = new Hono();

// -- /users
app.post("/add", async (context) => {
  const { username, password, display_name } = await context.req.json();
  const result = await User.create(username, password, display_name);
  if (result == http.Created) {
    context.status(http.Created);
    return context.json({
      status: http.Created,
      message: "User created",
    });
  }
  if (result == http.AlreadyExists) {
    context.status(http.AlreadyExists);
    return context.json({
      status: http.AlreadyExists,
      message: "User already exists",
    });
  }
  context.status(http.InternalSeverError);
  return context.json({
    status: http.InternalSeverError,
    message: "Server Error: Could not create user",
  });
});

export default app;
