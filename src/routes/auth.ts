import { Hono } from "hono";
import { HandlerResponse } from "hono/types";
import { http } from "../utils/httpResponse";
import { Auth } from "../models/auth";

const app = new Hono();

// -- /auth
app.post("/signin", async (context) => {
  const { username, password } = await context.req.json();
  const result = await Auth.signin(username, password);
  if (result.status == http.Ok) {
    context.status(http.Ok);
    return context.json({
      ...result,
      message: "User signed in",
    });
  }
  if (result.status == http.Unauthorized) {
    context.status(http.Unauthorized);
    return context.json({
      status: http.Unauthorized,
      message: "Invalid credential",
    });
  }
  if (result.status == http.InternalSeverError) {
    context.status(http.InternalSeverError);
    return context.json({
      status: http.InternalSeverError,
      message: "Internal server error",
    });
  }
});

export default app;
