/** @format */
import fetchBlog from "@@/script/fetch-blog.js";
import { updateData } from "../read-blog-data/route.js";

export async function GET() {
  try {
    await fetchBlog();
    updateData();
    return Response.json({ code: 0 });
  } catch (error) {
    return Response.json({ code: -1 });
  }
}
