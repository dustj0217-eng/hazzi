import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function sanitizeExtension(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if ([".webm", ".mp4", ".mov", ".m4v", ".ogv"].includes(extension)) {
    return extension;
  }

  return ".webm";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const video = formData.get("video");
    const roomId = formData.get("roomId");
    const roomName = formData.get("roomName");
    const durationSeconds = formData.get("durationSeconds");

    if (!(video instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "영상 파일이 없습니다." },
        { status: 400 }
      );
    }

    if (!video.type.startsWith("video/")) {
      return NextResponse.json(
        { ok: false, message: "영상 형식만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (video.size <= 0) {
      return NextResponse.json(
        { ok: false, message: "빈 영상은 업로드할 수 없습니다." },
        { status: 400 }
      );
    }

    if (video.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, message: "영상 용량은 25MB 이하여야 합니다." },
        { status: 413 }
      );
    }

    if (!roomId) {
      return NextResponse.json(
        { ok: false, message: "방 정보가 없습니다." },
        { status: 400 }
      );
    }

    const certificationId = crypto.randomUUID();
    const extension = sanitizeExtension(video.name);
    const filename = `${certificationId}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "certifications"
    );

    await mkdir(uploadDirectory, { recursive: true });

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(path.join(uploadDirectory, filename), buffer);

    const videoUrl = `/uploads/certifications/${filename}`;

    console.log("Certification uploaded", {
      certificationId,
      roomId: String(roomId),
      roomName: String(roomName ?? ""),
      durationSeconds: String(durationSeconds ?? ""),
      size: video.size,
      type: video.type,
      videoUrl,
    });

    return NextResponse.json({
      ok: true,
      certificationId,
      videoUrl,
      message: "인증이 업로드되었습니다.",
    });
  } catch (error) {
    console.error("Certification upload failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "서버에서 영상을 저장하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}
