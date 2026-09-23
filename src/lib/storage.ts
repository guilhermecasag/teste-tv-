import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function extensionFor(file: File) {
  const fromName = path.extname(file.name);
  if (fromName) return fromName;
  const fromType = file.type.split("/")[1];
  return fromType ? `.${fromType}` : "";
}

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Salva a foto do equipamento e retorna a URL publica.
 * Usa Supabase Storage quando configurado; senao, disco local em
 * /public/uploads (funcional para desenvolvimento, mas nao recomendado
 * em producao sem um bucket real).
 */
export async function saveEquipmentPhoto(
  tripId: string,
  equipmentId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato de imagem não suportado.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("A foto excede o limite de 10MB.");
  }

  const filename = `${randomUUID()}${extensionFor(file)}`;
  const objectPath = `trips/${tripId}/equipment/${equipmentId}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isSupabaseConfigured()) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "ltm-fotos";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Falha ao enviar foto: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const destDir = path.join(uploadsRoot, "trips", tripId, "equipment", equipmentId);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, filename), buffer);

  return `/uploads/trips/${tripId}/equipment/${equipmentId}/${filename}`;
}
