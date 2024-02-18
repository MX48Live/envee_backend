import { Hono } from "hono";
import { initialDatabse } from "./utils/initialDatabse";
import { initialLogDB } from "./utils/initialLogDB";
import { validateAccessToken } from "./utils/validateAccessToken";
import auth from "./routes/auth";
import users from "./routes/users";
import { http } from "./utils/httpResponse";
import writeLog from "./utils/logger";

const app = new Hono();
initialDatabse();
initialLogDB();

app.get("/test", async (context) => {
  const response = await validateAccessToken(context);
  if (response.status !== http.Ok) {
    context.status(http.Unauthorized);
    writeLog({ level: "info", by: "app", message: "Error Response" });
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

writeLog({ level: "info", by: "app", message: "Server started" });

export default app;
