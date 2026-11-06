import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { DATABASE_UUID } from '../../common/database-uuid.pipe.js';
export class PageQuery {
  @ApiPropertyOptional({ default: 1, maximum: 21474837 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // (page - 1) * limit phải vừa int32, kể cả limit tối đa 100.
  @Max(21474837)
  page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class ProductQuery extends PageQuery {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) q?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID)
  categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(DATABASE_UUID) brandId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^(0|[1-9]\d{0,18})$/)
  minPrice?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^(0|[1-9]\d{0,18})$/)
  maxPrice?: string;
  @ApiPropertyOptional({ enum: ['newest', 'name'] })
  @IsOptional()
  @IsIn(['newest', 'name'])
  sort: 'newest' | 'name' = 'newest';
}
export class CreateBrandDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;
  @ApiProperty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID)
  logoAssetId?: string;
}
export class UpdateBrandDto extends PartialType(CreateBrandDto, {
  skipNullProperties: false,
}) {}
export class CategoryDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) name: string;
  @ApiProperty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DATABASE_UUID)
  parentId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DATABASE_UUID)
  imageAssetId?: string | null;
  @ApiPropertyOptional()
  // Field tùy chọn có thể bỏ qua; null không phải số hợp lệ để ghi vào DB.
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder?: number;
}
export class UpdateCategoryDto extends PartialType(CategoryDto, {
  skipNullProperties: false,
}) {}
export class ActiveStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status: string;
}
export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(250) name: string;
  @ApiProperty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(280)
  slug: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DATABASE_UUID)
  brandId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DATABASE_UUID)
  taxClassId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string | null;
}
export class UpdateProductDto extends PartialType(CreateProductDto, {
  skipNullProperties: false,
}) {}
export class AssignCategoriesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @Matches(DATABASE_UUID, { each: true })
  categoryIds: string[];
  @ApiProperty() @Matches(DATABASE_UUID) primaryCategoryId: string;
}
export class OptionValueDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9_-]{1,100}$/) code: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) label: string;
}
export class CreateOptionDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) code: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) name: string;
  @ApiProperty({ type: [OptionValueDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OptionValueDto)
  values: OptionValueDto[];
}
export class CreateVariantDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9._-]{1,100}$/) sku: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10)
  @Matches(DATABASE_UUID, { each: true })
  optionValueIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  weightGrams?: number;
}
export class UpdateVariantDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  weightGrams?: number;
  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10)
  @Matches(DATABASE_UUID, { each: true })
  optionValueIds?: string[];
}
export class AttributeDefinitionDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) code: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) name: string;
  @ApiProperty({ enum: ['TEXT', 'NUMBER', 'BOOLEAN'] })
  @IsIn(['TEXT', 'NUMBER', 'BOOLEAN'])
  dataType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) unit?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  isFilterable = false;
}
export class CategoryAttributeDto {
  @ApiProperty() @Matches(DATABASE_UUID) attributeId: string;
  @ApiProperty() @IsBoolean() isRequired: boolean;
}
export class CategoryAttributesDto {
  @ApiProperty({ type: [CategoryAttributeDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CategoryAttributeDto)
  attributes: CategoryAttributeDto[];
}
export class AttributeValueDto {
  @ApiProperty() @Matches(DATABASE_UUID) attributeId: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  textValue?: string;
  @ApiPropertyOptional({
    description: 'Exact decimal string, up to 14 whole and 6 fraction digits',
  })
  @IsOptional()
  @Matches(/^-?\d{1,14}(\.\d{1,6})?$/)
  numberValue?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() booleanValue?: boolean;
}
export class AttributeValuesDto {
  @ApiProperty({ type: [AttributeValueDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  attributes: AttributeValueDto[];
}
export class LinkMediaDto {
  @ApiProperty() @Matches(DATABASE_UUID) assetId: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DATABASE_UUID)
  variantId?: string | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder = 0;
  @ApiPropertyOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  isPrimary = false;
}
