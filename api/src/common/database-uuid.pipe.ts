import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
// Native PostgreSQL UUIDs include deterministic IDs from the v1->v2 backfill,
// which are not necessarily RFC version-4 UUIDs.
export const DATABASE_UUID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
@Injectable()
export class DatabaseUuidPipe implements PipeTransform {
  transform(value: unknown) {
    if (typeof value !== 'string' || !DATABASE_UUID.test(value))
      throw new BadRequestException('A UUID identifier is required');
    return value.toLowerCase();
  }
}
