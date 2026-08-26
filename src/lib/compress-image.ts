export async function compressImage(file: File, maxChars = 400_000): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 900;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  let quality = 0.78;
  let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > maxChars && quality > 0.35) {
    quality -= 0.08;
    data = canvas.toDataURL("image/jpeg", quality);
  }
  if (data.length > maxChars) {
    throw new Error("La imagen sigue siendo muy pesada. Prueba otra más liviana.");
  }
  return data;
}
