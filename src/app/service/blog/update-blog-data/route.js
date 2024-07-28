/** @format */
// import fetchBlog from "@@/script/fetch-blog.js";
// import { updateData } from "../read-blog-data/route.js";
// export const runtime = "edge";

export async function GET() {
  return Response.json({ code: 0 });
  // try {
  //   await fetchBlog();
  //   updateData();
  // } catch (error) {
  //   console.log("[update blog data error]: ", error);
  //   return Response.json({ code: -1 });
  // }
}
