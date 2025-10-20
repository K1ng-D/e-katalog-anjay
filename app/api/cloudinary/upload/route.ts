// app/api/cloudinary/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from "cloudinary";

export const runtime = "nodejs"; // wajib: jangan Edge untuk upload_stream

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

async function uploadBuffer(buffer: Buffer, folder = "uploads") {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // terima banyak file: name='files'
    const files = formData.getAll("files") as File[];
    if (!files.length) {
      // fallback: single file dengan name='file'
      const single = formData.get("file") as File | null;
      if (!single)
        return NextResponse.json(
          { error: "No file(s) provided" },
          { status: 400 }
        );
      files.push(single);
    }

    const buffers = await Promise.all(
      files.map(async (f) => Buffer.from(await f.arrayBuffer()))
    );
    const results = await Promise.all(
      buffers.map((buf) => uploadBuffer(buf, "uploads"))
    );

    const out = results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
    }));

    return NextResponse.json({ files: out });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
