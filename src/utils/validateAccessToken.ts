import { Context } from "hono";
import { http } from "./httpResponse";
import { verify } from "hono/jwt";

export async function validateAccessToken(context: Context) {
  const token = context.req.header("Authorization");

  if (!token || token.split(" ").length != 2) {
    return { status: http.Unauthorized, data: undefined };
  }
  if (token.split(" ")[0] !== "Bearer") {
    return { status: http.Unauthorized, data: undefined };
  }

  const JWT_SECRET = process.env.JWT_TOKEN || "";
  const bearerToken = token.split(" ")[1];
  try {
    const decodedPayload = await verify(bearerToken, JWT_SECRET);

    if (!decodedPayload.id) {
      console.log("decode failed");
      return { status: http.Unauthorized, data: undefined };
    }
    console.log("decode success");
    return { status: http.Ok, data: decodedPayload };
  } catch (error) {
    console.log("Error decode", error);
    return { status: http.Unauthorized, data: undefined };
  }
}
