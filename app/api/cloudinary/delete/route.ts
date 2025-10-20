// app/api/cloudinary/delete/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json(
        { ok: false, error: "Missing publicId" },
        { status: 400 }
      );
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
