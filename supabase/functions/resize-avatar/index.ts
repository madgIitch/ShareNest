import { createClient } from "jsr:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const THUMB_SIZE = 256;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { userId, path } = await req.json() as { userId: string; path: string };
  if (!userId || !path) {
    return new Response(JSON.stringify({ error: "userId and path are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Descargar el original desde storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("avatars")
    .download(path);

  if (downloadError || !fileData) {
    return new Response(JSON.stringify({ error: downloadError?.message ?? "Download failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buffer = new Uint8Array(await fileData.arrayBuffer());
  const image = await Image.decode(buffer);

  // Recortar a cuadrado centrado, luego redimensionar
  const side = Math.min(image.width, image.height);
  const x = Math.floor((image.width - side) / 2);
  const y = Math.floor((image.height - side) / 2);
  image.crop(x, y, side, side);
  image.resize(THUMB_SIZE, THUMB_SIZE);

  const thumbBytes = await image.encodeJPEG(85);
  const thumbPath = `${userId}/thumb.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(thumbPath, thumbBytes, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(thumbPath);

  return new Response(JSON.stringify({ thumbUrl: urlData.publicUrl }), {
    headers: { "Content-Type": "application/json" },
  });
});
