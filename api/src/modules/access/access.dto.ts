import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATABASE_UUID } from '../../common/database-uuid.pipe.js';
export class CreateRoleDto {
  @ApiProperty({ example: 'SUPPORT' })
  @Matches(/^[A-Z][A-Z0-9_]{1,63}$/)
  code: string;
  @ApiProperty() @IsString() @MaxLength(100) name: string;
}
export class SetPermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  codes: string[];
}
export class SetRolesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Matches(DATABASE_UUID, { each: true })
  roleIds: string[];
}
