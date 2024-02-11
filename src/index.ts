import { Context, Hono } from "hono";
import { initialDatabse } from "./utils/initialDatabse";
import { logger } from "hono/logger";
import { validateAccessToken } from "./utils/validateAccessToken";
import auth from "./routes/auth";
import users from "./routes/users";
import { http } from "./utils/httpResponse";

const app = new Hono();
initialDatabse();
app.use(logger());

app.get("/test", async (context) => {
  const response = await validateAccessToken(context);
  if (response.status !== http.Ok) {
    context.status(http.Unauthorized);
    return context.json({
      status: http.Unauthorized,
      message: "Unauthorized",
    });
  }
  return context.json({
    message: "You are authorized",
    test: {
      test: "test",
    },
  });
});

app.route("/auth", auth);
app.route("/users", users);

export default app;
