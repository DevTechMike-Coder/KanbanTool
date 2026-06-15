import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

const BUCKET = "task-attachments";

function getStorageConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

  if (!supabaseUrl) return { error: "SUPABASE_URL is not configured." };
  if (!serviceKey) {
    return {
      error: "SUPABASE_SERVICE_KEY is not configured. Add it to your .env file.",
    };
  }
  return { supabaseUrl, serviceKey };
}

/** Strips non-ASCII, spaces and path-separator characters from a filename. */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w.\-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

export async function POST(request: NextRequest) {
  // ── Auth check ───────────────────────────────────────────────────────────────
  const cookieHeader = request.headers.get("cookie");
  const userId = await getSessionUserIdFromCookies(cookieHeader);
  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to upload files." },
      { status: 401 },
    );
  }

  // ── Storage config ───────────────────────────────────────────────────────────
  const config = getStorageConfig();
  if ("error" in config) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request — expected multipart/form-data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided in the request." },
      { status: 400 },
    );
  }

  const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 20 MB limit." },
      { status: 413 },
    );
  }

  // ── Scope path to the authenticated user ─────────────────────────────────────
  // Prefix with userId so files are namespaced per user.
  // This means:
  //   - Users cannot overwrite each other's files (IDOR write)
  //   - Storage bucket policies can restrict reads to the owning user if needed
  const safeName = sanitizeFileName(file.name);
  const objectPath = `${userId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const ext = safeName.split(".").pop()?.toLowerCase() || "";
  const SAFE_EXTENSION_MAP: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const contentType = SAFE_EXTENSION_MAP[ext];
  if (!contentType) {
    return NextResponse.json(
      { error: "File type / extension not allowed. Please upload images, PDFs, archives, or document files." },
      { status: 400 },
    );
  }

  // Magic bytes validation for common formats
  const header = buffer.subarray(0, 4).toString("hex").toUpperCase();
  if (ext === "png" && header !== "89504E47") {
    return NextResponse.json({ error: "Invalid PNG file content." }, { status: 400 });
  }
  if ((ext === "jpg" || ext === "jpeg") && !header.startsWith("FFD8FF")) {
    return NextResponse.json({ error: "Invalid JPEG file content." }, { status: 400 });
  }
  if (ext === "gif" && header !== "47494638") {
    return NextResponse.json({ error: "Invalid GIF file content." }, { status: 400 });
  }
  if (ext === "pdf" && header !== "25504446") {
    return NextResponse.json({ error: "Invalid PDF file content." }, { status: 400 });
  }
  if (ext === "zip" && header !== "504B0304") {
    return NextResponse.json({ error: "Invalid ZIP archive." }, { status: 400 });
  }
  if ((ext === "docx" || ext === "xlsx") && header !== "504B0304") {
    return NextResponse.json({ error: "Invalid document format." }, { status: 400 });
  }
  if (ext === "webp") {
    const isWebp =
      buffer.subarray(0, 4).toString("hex").toUpperCase() === "52494646" &&
      buffer.subarray(8, 12).toString("hex").toUpperCase() === "57454250";
    if (!isWebp) {
      return NextResponse.json({ error: "Invalid WebP image." }, { status: 400 });
    }
  }
  if (ext === "txt" || ext === "csv") {
    const textContent = buffer.subarray(0, 1024).toString("utf8").toLowerCase();
    if (
      textContent.includes("<html") ||
      textContent.includes("<script") ||
      textContent.includes("javascript:") ||
      textContent.includes("onload=") ||
      textContent.includes("onerror=")
    ) {
      return NextResponse.json(
        { error: "HTML / script elements detected in text file." },
        { status: 400 },
      );
    }
  }

  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${BUCKET}/${objectPath}`;

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceKey}`,
      apikey: config.serviceKey,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const payload = await uploadResponse.json().catch(() => null);
    const msg =
      payload?.error?.message ??
      payload?.message ??
      payload?.error ??
      "Storage upload failed.";
    console.error("[upload] Supabase Storage error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectPath}`;

  return NextResponse.json({
    url: publicUrl,
    fileName: file.name,
    fileSize: file.size,
  });
}
