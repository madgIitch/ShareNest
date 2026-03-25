import { createClient } from "jsr:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const MAX_SIZE = 1200;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { path } = await req.json() as { path: string };
  if (!path) {
    return new Response(JSON.stringify({ error: "path required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("listing-images")
    .download(path);

  if (downloadError || !fileData) {
    return new Response(JSON.stringify({ error: downloadError?.message ?? "Download failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buffer = new Uint8Array(await fileData.arrayBuffer());
  const image = await Image.decode(buffer);

  // Redimensionar manteniendo aspecto si alguna dimensión supera MAX_SIZE
  if (image.width > MAX_SIZE || image.height > MAX_SIZE) {
    const ratio = Math.min(MAX_SIZE / image.width, MAX_SIZE / image.height);
    image.resize(Math.round(image.width * ratio), Math.round(image.height * ratio));
  }

  const resized = await image.encodeJPEG(88);

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(path, resized, { contentType: "image/jpeg", upsert: true });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);

  return new Response(JSON.stringify({ url: urlData.publicUrl }), {
    headers: { "Content-Type": "application/json" },
  });
});
