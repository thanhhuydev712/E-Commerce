import { describe, it, expect } from 'vitest';
import {
  optionSignature,
  visibleCategoryIds,
  vnd,
  MAX_MONEY,
} from './catalog.rules.js';
import { inspectImage } from '../media/image.rules.js';
import { BadRequestException } from '@nestjs/common';
describe('Catalog money, taxonomy and media boundaries', () => {
  it('preserves integer money beyond JS number precision; rejects rounding and overflow', () => {
    expect(vnd('9007199254740993')).toBe(9007199254740993n);
    expect(vnd(MAX_MONEY.toString())).toBe(MAX_MONEY);
    for (const value of ['-1', '0.1', '001', '9223372036854775808'])
      expect(() => vnd(value)).toThrow();
  });
  it('makes variant signatures independent of request ordering', () => {
    expect(optionSignature(['BB', 'aa'])).toBe(optionSignature(['AA', 'bb']));
    expect(optionSignature([])).toBe('default');
  });
  it('hides descendants of inactive categories and detects cycles even in archived trees', () => {
    expect(
      visibleCategoryIds([
        { id: 'a', parentId: null, status: 'ARCHIVED' },
        { id: 'b', parentId: 'a', status: 'ACTIVE' },
      ]),
    ).toEqual([]);
    expect(() =>
      visibleCategoryIds(
        [
          { id: 'a', parentId: 'b', status: 'ARCHIVED' },
          { id: 'b', parentId: 'a', status: 'ARCHIVED' },
        ],
        true,
      ),
    ).toThrow();
  });
  it('rejects mime spoofing, script formats and oversized image dimensions', () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1hYAAAAASUVORK5CYII=',
      'base64',
    );
    expect(inspectImage(png, 'image/png')).toMatchObject({
      width: 1,
      height: 1,
      mimeType: 'image/png',
    });
    expect(() => inspectImage(png, 'image/jpeg')).toThrow();
    expect(() =>
      inspectImage(Buffer.from('<svg/>'), 'image/svg+xml'),
    ).toThrow();
    const large = Buffer.from(png);
    large.writeUInt32BE(20001, 16);
    expect(() => inspectImage(large, 'image/png')).toThrow();
  });
  it('returns a validation error for truncated JPEG markers instead of a range error', () => {
    const truncated = Buffer.from('ffd8' + 'ff'.repeat(18) + 'd9', 'hex');
    expect(() => inspectImage(truncated, 'image/jpeg')).toThrow(
      BadRequestException,
    );
  });
});
