import { Hono } from "hono";
import { initialDatabse } from "./utils/initialDatabse";
import auth from "./routes/auth";
import users from "./routes/users";

const app = new Hono();

initialDatabse();

app.route("/auth", auth);
app.route("/users", users);

export default app;
