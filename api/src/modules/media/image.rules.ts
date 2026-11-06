import { BadRequestException } from '@nestjs/common';
function invalid(): never {
  throw new BadRequestException(
    'Only valid PNG/JPEG images within size/dimension limits are accepted',
  );
}
export function inspectImage(bytes: Buffer, declaredMime: string) {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) invalid();
  let width = 0,
    height = 0,
    mime = '',
    extension = '';
  if (
    bytes.length >= 45 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    if (
      bytes.readUInt32BE(8) !== 13 ||
      bytes.toString('ascii', 12, 16) !== 'IHDR' ||
      bytes.toString('ascii', bytes.length - 8, bytes.length - 4) !== 'IEND'
    )
      invalid();
    width = bytes.readUInt32BE(16);
    height = bytes.readUInt32BE(20);
    mime = 'image/png';
    extension = 'png';
    let offset = 8,
      hasData = false;
    while (offset < bytes.length) {
      if (offset + 12 > bytes.length) invalid();
      const length = bytes.readUInt32BE(offset),
        kind = bytes.toString('ascii', offset + 4, offset + 8);
      if (length > bytes.length - offset - 12) invalid();
      if (kind === 'IDAT') hasData = true;
      offset += length + 12;
    }
    if (offset !== bytes.length || !hasData) invalid();
  } else if (
    bytes.length >= 16 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217
  ) {
    mime = 'image/jpeg';
    extension = 'jpg';
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset++] !== 255) invalid();
      while (offset < bytes.length && bytes[offset] === 255) offset++;
      if (offset >= bytes.length) invalid();
      const marker = bytes[offset++];
      if (marker === 218) break;
      // Marker bị cắt phải trả 400, tránh readUInt16BE ném RangeError thành 500.
      if (offset + 2 > bytes.length) invalid();
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) invalid();
      if ([192, 193, 194].includes(marker)) {
        if (length < 8) invalid();
        height = bytes.readUInt16BE(offset + 3);
        width = bytes.readUInt16BE(offset + 5);
        break;
      }
      offset += length;
    }
  } else invalid();
  if (
    mime !== declaredMime ||
    width < 1 ||
    height < 1 ||
    width > 20000 ||
    height > 20000 ||
    width * height > 25000000
  )
    invalid();
  return { width, height, mimeType: mime, extension };
}
