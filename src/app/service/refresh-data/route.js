/** @format */
import { getData } from "@@/script";

export async function GET() {
  // await getData();
  return Response.json({
    code: 0,
  });
}
