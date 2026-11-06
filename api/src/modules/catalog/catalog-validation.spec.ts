import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  AttributeDefinitionDto,
  CategoryDto,
  LinkMediaDto,
  UpdateCategoryDto,
  UpdateVariantDto,
  PageQuery,
} from './catalog.dto.js';
import { TaxRateDto } from '../pricing/pricing.dto.js';
import { ListAccountsDto } from '../accounts/accounts.dto.js';

const id = '00000000-0000-4000-8000-000000000001';
describe('Optional catalog fields at the HTTP boundary', () => {
  it('rejects page values that overflow Prisma integer offsets', () => {
    for (const Dto of [PageQuery, ListAccountsDto]) {
      expect(
        validateSync(plainToInstance(Dto, { page: '21474837', limit: '100' })),
      ).toEqual([]);
      for (const page of ['21474838', '999999999999999999'])
        expect(
          validateSync(plainToInstance(Dto, { page })).map(
            (error) => error.property,
          ),
        ).toContain('page');
    }
  });
  it('rejects null where optional means omitted, before reaching Prisma or array operations', () => {
    const invalid = [
      [
        plainToInstance(CategoryDto, {
          name: 'Test',
          slug: 'test',
          sortOrder: null,
        }),
        'sortOrder',
      ],
      [plainToInstance(UpdateCategoryDto, { sortOrder: null }), 'sortOrder'],
      [
        plainToInstance(UpdateVariantDto, { optionValueIds: null }),
        'optionValueIds',
      ],
      [
        plainToInstance(AttributeDefinitionDto, {
          code: 'test',
          name: 'Test',
          dataType: 'BOOLEAN',
          isFilterable: null,
        }),
        'isFilterable',
      ],
      [
        plainToInstance(LinkMediaDto, { assetId: id, sortOrder: null }),
        'sortOrder',
      ],
      [
        plainToInstance(LinkMediaDto, { assetId: id, isPrimary: null }),
        'isPrimary',
      ],
      [
        plainToInstance(TaxRateDto, {
          code: 'VAT',
          countryCode: 'VN',
          rate: '0.1',
          effectiveFrom: '2026-01-01T00:00:00Z',
          priority: null,
        }),
        'priority',
      ],
    ] as const;
    for (const [dto, field] of invalid)
      expect(
        validateSync(dto).map((error) => error.property),
        field,
      ).toContain(field);
  });
  it('allows omitted fields, false/zero and explicit null on nullable relations', () => {
    for (const dto of [
      plainToInstance(UpdateCategoryDto, {}),
      plainToInstance(UpdateCategoryDto, {
        parentId: null,
        imageAssetId: null,
        sortOrder: 0,
      }),
      plainToInstance(UpdateVariantDto, {
        name: null,
        barcode: null,
        optionValueIds: [],
      }),
      plainToInstance(AttributeDefinitionDto, {
        code: 'test',
        name: 'Test',
        dataType: 'BOOLEAN',
        isFilterable: false,
      }),
      plainToInstance(LinkMediaDto, {
        assetId: id,
        variantId: null,
        sortOrder: 0,
        isPrimary: false,
      }),
    ])
      expect(validateSync(dto)).toEqual([]);
  });
});
