import { PNG } from "pngjs";
import { inflateSync } from "node:zlib";
import { imageSignatureMatches, MAX_RETURN_IMAGE_BYTES } from "./returns-core.ts";

/** The browser normalizes JPEG/PNG/WebP to a bounded PNG. Never trust that step:
 * validate, bound decompression, decode pixels and rebuild on the server as well.
 * Pure JS + standard zlib works on Cloudflare; no native sharp dependency. */
export async function cleanComplaintImage(bytes: Uint8Array, mime: string): Promise<Uint8Array> {
  if (
    mime !== "image/png" ||
    bytes.length < 33 ||
    bytes.length > MAX_RETURN_IMAGE_BYTES ||
    !imageSignatureMatches(bytes, mime)
  )
    throw new Error("Invalid image");
  const buffer = Buffer.from(bytes);
  if (buffer.toString("ascii", 12, 16) !== "IHDR" || buffer.readUInt32BE(8) !== 13)
    throw new Error("Invalid header");
  const width = buffer.readUInt32BE(16),
    height = buffer.readUInt32BE(20),
    depth = buffer[24],
    color = buffer[25];
  if (
    !width ||
    !height ||
    width > 1600 ||
    height > 1600 ||
    depth !== 8 ||
    (color !== 2 && color !== 6) ||
    buffer[26] !== 0 ||
    buffer[27] !== 0 ||
    buffer[28] !== 0
  )
    throw new Error("Unsupported image dimensions or format");
  let end = false;
  const compressed: Buffer[] = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const size = buffer.readUInt32BE(offset),
      type = buffer.toString("ascii", offset + 4, offset + 8);
    if (size > buffer.length - offset - 12 || type === "acTL" || (type === "IHDR" && offset !== 8))
      throw new Error("Invalid PNG chunk");
    if (type === "IDAT") compressed.push(buffer.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
    if (type === "IEND") {
      if (size !== 0 || offset !== buffer.length) throw new Error("Invalid PNG ending");
      end = true;
      break;
    }
  }
  if (!end || !compressed.length) throw new Error("Incomplete PNG");
  const expected = (width * (color === 6 ? 4 : 3) + 1) * height;
  // Reject decompression bombs before invoking the pixel decoder.
  if (inflateSync(Buffer.concat(compressed), { maxOutputLength: expected }).length !== expected)
    throw new Error("Invalid pixel data");
  const pixels = await new Promise<PNG>((resolve, reject) =>
    new PNG({ checkCRC: true }).parse(buffer, (error, data) =>
      error ? reject(error) : resolve(data),
    ),
  );
  const rebuilt = new PNG({ width, height });
  rebuilt.data = pixels.data;
  const output = PNG.sync.write(rebuilt, { colorType: 6, bitDepth: 8, deflateLevel: 6 });
  if (output.length > MAX_RETURN_IMAGE_BYTES) throw new Error("Image too large");
  return output;
}
