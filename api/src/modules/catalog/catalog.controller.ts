import { ApiData } from '../../platform/api-response.js';
import {
  ProductResponseDto,
  ProductPageDto,
  CategoryResponseDto,
  BrandResponseDto,
} from './catalog-response.dto.js';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import {
  PermissionGuard,
  RequirePermissions,
} from '../access/permission.guard.js';
import { CatalogService } from './catalog.service.js';
import {
  ProductQuery,
  CreateBrandDto,
  UpdateBrandDto,
  CategoryDto,
  UpdateCategoryDto,
  ActiveStatusDto,
  CreateProductDto,
  UpdateProductDto,
  AssignCategoriesDto,
  CreateOptionDto,
  CreateVariantDto,
  UpdateVariantDto,
  AttributeDefinitionDto,
  CategoryAttributesDto,
  AttributeValuesDto,
  LinkMediaDto,
} from './catalog.dto.js';
@ApiTags('catalog')
@Controller()
export class PublicCatalogController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}
  @ApiData(ProductPageDto)
  @Get('products')
  products(@Query() query: ProductQuery) {
    return this.catalog.products(query);
  }
  @ApiData(ProductResponseDto)
  @Get('products/:slug')
  product(@Param('slug') slug: string) {
    return this.catalog.product(slug);
  }
  @ApiData(CategoryResponseDto, 200, true)
  @Get('categories')
  categories() {
    return this.catalog.categories();
  }
  @ApiData(BrandResponseDto, 200, true)
  @Get('brands')
  brands() {
    return this.catalog.brands();
  }
}
@ApiTags('admin-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin')
export class AdminCatalogController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}
  @Get('products') @RequirePermissions('catalog.read') products(
    @Query() query: ProductQuery,
  ) {
    return this.catalog.products(query, true);
  }
  @Get('products/:id') @RequirePermissions('catalog.read') product(
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.catalog.adminProduct(id);
  }
  @Post('products') @RequirePermissions('catalog.write') create(
    @CurrentUser() user: Principal,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalog.saveProduct(user.id, dto);
  }
  @Patch('products/:id') @RequirePermissions('catalog.write') update(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalog.saveProduct(user.id, dto, id);
  }
  @Post('products/:id/publish')
  @HttpCode(200)
  @RequirePermissions('catalog.write')
  publish(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.catalog.transition(user.id, id, 'ACTIVE');
  }
  @Post('products/:id/unpublish')
  @HttpCode(200)
  @RequirePermissions('catalog.write')
  draft(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.catalog.transition(user.id, id, 'DRAFT');
  }
  @Post('products/:id/archive')
  @HttpCode(200)
  @RequirePermissions('catalog.write')
  archive(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.catalog.transition(user.id, id, 'ARCHIVED');
  }
  @Put('products/:id/categories')
  @RequirePermissions('catalog.write')
  categoriesSet(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: AssignCategoriesDto,
  ) {
    return this.catalog.assignCategories(user.id, id, dto);
  }
  @Post('products/:id/options') @RequirePermissions('catalog.write') option(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: CreateOptionDto,
  ) {
    return this.catalog.createOption(user.id, id, dto);
  }
  @Post('products/:id/variants') @RequirePermissions('catalog.write') variant(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.catalog.createVariant(user.id, id, dto);
  }
  @Patch('variants/:id') @RequirePermissions('catalog.write') variantUpdate(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.catalog.updateVariant(user.id, id, dto);
  }
  @Put('variants/:id/status')
  @RequirePermissions('catalog.write')
  variantStatus(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: ActiveStatusDto,
  ) {
    return this.catalog.variantStatus(user.id, id, dto.status);
  }
  @Get('brands') @RequirePermissions('catalog.read') brands() {
    return this.catalog.brands(true);
  }
  @Post('brands') @RequirePermissions('catalog.write') brand(
    @CurrentUser() user: Principal,
    @Body() dto: CreateBrandDto,
  ) {
    return this.catalog.saveBrand(user.id, dto);
  }
  @Patch('brands/:id') @RequirePermissions('catalog.write') brandUpdate(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.catalog.saveBrand(user.id, dto, id);
  }
  @Put('brands/:id/status') @RequirePermissions('catalog.write') brandStatus(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: ActiveStatusDto,
  ) {
    return this.catalog.brandStatus(user.id, id, dto.status);
  }
  @Get('categories') @RequirePermissions('catalog.read') categories() {
    return this.catalog.categories(true);
  }
  @Post('categories') @RequirePermissions('catalog.write') category(
    @CurrentUser() user: Principal,
    @Body() dto: CategoryDto,
  ) {
    return this.catalog.saveCategory(user.id, dto);
  }
  @Patch('categories/:id') @RequirePermissions('catalog.write') categoryUpdate(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalog.saveCategory(user.id, dto, id);
  }
  @Put('categories/:id/status')
  @RequirePermissions('catalog.write')
  categoryStatus(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: ActiveStatusDto,
  ) {
    return this.catalog.categoryStatus(user.id, id, dto.status);
  }
  @Get('attributes') @RequirePermissions('catalog.read') attributes() {
    return this.catalog.definitions();
  }
  @Post('attributes') @RequirePermissions('catalog.write') attribute(
    @CurrentUser() user: Principal,
    @Body() dto: AttributeDefinitionDto,
  ) {
    return this.catalog.createDefinition(user.id, dto);
  }
  @Put('categories/:id/attributes')
  @RequirePermissions('catalog.write')
  categoryAttributes(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: CategoryAttributesDto,
  ) {
    return this.catalog.categoryAttributes(user.id, id, dto);
  }
  @Put('products/:id/attributes')
  @RequirePermissions('catalog.write')
  productAttributes(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: AttributeValuesDto,
  ) {
    return this.catalog.setAttributes(user.id, id, dto);
  }
  @Put('variants/:id/attributes')
  @RequirePermissions('catalog.write')
  variantAttributes(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: AttributeValuesDto,
  ) {
    return this.catalog.setAttributes(user.id, id, dto, true);
  }
  @Post('products/:id/media') @RequirePermissions('catalog.write') media(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: LinkMediaDto,
  ) {
    return this.catalog.linkMedia(user.id, id, dto);
  }
}
