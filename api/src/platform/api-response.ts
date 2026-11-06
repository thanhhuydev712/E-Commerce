import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
  ApiProperty,
} from '@nestjs/swagger';
export class MessageDto {
  @ApiProperty() message: string;
}
export function ApiData(type: Type<unknown>, status = 200, array = false) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: array
            ? { type: 'array', items: { $ref: getSchemaPath(type) } }
            : { $ref: getSchemaPath(type) },
          meta: {
            type: 'object',
            required: ['requestId'],
            properties: { requestId: { type: 'string', format: 'uuid' } },
          },
        },
      },
    }),
  );
}
