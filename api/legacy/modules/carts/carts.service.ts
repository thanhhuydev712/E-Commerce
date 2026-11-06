import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { CartResponseDto } from './dto/cart-response.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    cartItems: {
      include: {
        product: true;
      };
    };
  };
}>;

type CartApiResponse = {
  success: boolean;
  data: CartResponseDto;
  message: string;
};

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy giỏ hàng chưa checkout; chưa có thì tạo mới.
  private async getOrCreateActiveCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        checkedOut: false,
      },
    });

    if (cart) {
      return cart;
    }

    return this.prisma.cart.create({
      data: {
        userId,
        checkedOut: false,
      },
    });
  }

  // Lấy giỏ hàng cùng danh sách sản phẩm.
  private async loadCart(cartId: string): Promise<CartWithItems> {
    const cart = await this.prisma.cart.findUnique({
      where: {
        id: cartId,
      },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    return cart;
  }

  // Chuyển kết quả Prisma thành dữ liệu response cho frontend.
  private mapToCartResponse(cart: CartWithItems): CartResponseDto {
    const items = cart.cartItems.map((item) => {
      const price = Number(item.product.price);

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        imageUrl: item.product.imageUrl,
        price,
        quantity: item.quantity,
        subtotal: Number((price * item.quantity).toFixed(2)),
        stock: item.product.stock,
      };
    });

    const totalItems = items.reduce((total, item) => total + item.quantity, 0);

    const total = Number(
      items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
    );

    return {
      id: cart.id,
      userId: cart.userId,
      checkedOut: cart.checkedOut,
      items,
      totalItems,
      total,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private wrap(cart: CartWithItems, message: string): CartApiResponse {
    return {
      success: true,
      data: this.mapToCartResponse(cart),
      message,
    };
  }

  // GET: Lấy giỏ hàng của người dùng hiện tại.
  async getMyCart(userId: string): Promise<CartApiResponse> {
    const cart = await this.getOrCreateActiveCart(userId);
    const cartWithItems = await this.loadCart(cart.id);

    return this.wrap(cartWithItems, 'Lấy giỏ hàng thành công');
  }

  // POST: Thêm sản phẩm vào giỏ hàng.
  async addItem(userId: string, dto: AddCartItemDto): Promise<CartApiResponse> {
    const quantity = dto.quantity ?? 1;

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh',
      );
    }

    if (quantity > product.stock) {
      throw new BadRequestException('Số lượng yêu cầu vượt quá tồn kho');
    }

    const cart = await this.getOrCreateActiveCart(userId);

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id,
      },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (newQuantity > product.stock) {
      throw new BadRequestException('Tổng số lượng trong giỏ vượt quá tồn kho');
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity,
        },
      });
    }

    const updatedCart = await this.loadCart(cart.id);

    return this.wrap(updatedCart, 'Thêm sản phẩm vào giỏ hàng thành công');
  }

  // PATCH: Cập nhật số lượng sản phẩm trong giỏ hàng.
  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartApiResponse> {
    // 1. Kiểm tra số lượng đầu vào.
    if (!Number.isInteger(dto.quantity) || dto.quantity < 1) {
      throw new BadRequestException(
        'Số lượng phải là số nguyên lớn hơn hoặc bằng 1',
      );
    }

    // 2. Tìm giỏ hàng đang hoạt động của người dùng.
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        checkedOut: false,
      },
    });

    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng đang hoạt động');
    }

    // 3. Tìm đúng CartItem thuộc giỏ hàng này.
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    // 4. Không cho cập nhật sản phẩm đã ngừng kinh doanh.
    if (!item.product.isActive) {
      throw new BadRequestException('Sản phẩm đã ngừng kinh doanh');
    }

    // 5. Kiểm tra tồn kho.
    if (dto.quantity > item.product.stock) {
      throw new BadRequestException(
        `Số lượng yêu cầu vượt quá tồn kho. Tồn kho hiện tại: ${item.product.stock}`,
      );
    }

    // 6. Cập nhật số lượng CartItem.
    await this.prisma.cartItem.update({
      where: {
        id: item.id,
      },
      data: {
        quantity: dto.quantity,
      },
    });

    // 7. Lấy lại giỏ hàng để trả về dữ liệu mới nhất.
    const updatedCart = await this.loadCart(cart.id);

    return this.wrap(updatedCart, 'Cập nhật giỏ hàng thành công');
  }

  // DELETE: Xóa một sản phẩm khỏi giỏ.
  async removeItem(userId: string, itemId: string): Promise<CartApiResponse> {
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        checkedOut: false,
      },
    });

    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    await this.prisma.cartItem.delete({
      where: {
        id: item.id,
      },
    });

    const updatedCart = await this.loadCart(cart.id);

    return this.wrap(updatedCart, 'Xóa sản phẩm khỏi giỏ hàng thành công');
  }

  // DELETE: Xóa toàn bộ sản phẩm trong giỏ.
  async clearCart(userId: string): Promise<CartApiResponse> {
    const cart = await this.getOrCreateActiveCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    const updatedCart = await this.loadCart(cart.id);

    return this.wrap(updatedCart, 'Đã làm trống giỏ hàng');
  }
}
