# Landing page E-Commerce — Next.js + Tailwind CSS v4

Bộ giao diện landing page lấy cảm hứng từ cấu trúc website Tinh Học Ngôi Sao, được chia thành các React components để dễ học, bảo trì và kết nối NestJS API.

> Đây là bản dựng phục vụ học tập, không phải bản sao pixel-perfect. Ảnh, giá, đánh giá và sản phẩm là dữ liệu minh họa. Hãy thay bằng dữ liệu thật của dự án.

## 1. Stack và nguyên tắc kỹ thuật

- Next.js App Router + React + TypeScript.
- Tailwind CSS v4: toàn bộ styling viết bằng utility classes ngay trong `className`.
- `lucide-react`: icon dạng component.
- Không dùng SCSS, Sass, CSS Modules hoặc styled-components.
- Dữ liệu demo tách khỏi UI tại `src/data/home-data.ts`.
- Kiểu dữ liệu dùng chung đặt tại `src/components/home/types.ts`.

### Cài dependency

Tailwind CSS v4 đã được cài và cấu hình trong dự án thì không cần cài lại. Bộ giao diện chỉ cần icon:

```bash
npm install lucide-react
```

Nếu dự án chưa có Tailwind v4 theo hướng dẫn PostCSS chính thức, kiểm tra các package `tailwindcss` và `@tailwindcss/postcss`, cùng cấu hình `postcss.config.mjs` của dự án. Không cài `sass` cho bộ code này.

Trong `src/app/globals.css`, Tailwind v4 dùng cú pháp import:

```css
@import "tailwindcss";

html { scroll-behavior: smooth; }
```

Không cần tạo `tailwind.config.js` chỉ để dùng các class mặc định. Với cấu hình theme tùy chỉnh, Tailwind v4 ưu tiên CSS-first configuration bằng `@theme`.

## 2. Tích hợp vào App Router

Copy `src/components/home` và `src/data` vào thư mục `src` của dự án. Sau đó dùng ở `src/app/page.tsx`:

```tsx
import HomePage from "@/components/home/HomePage";

export default function Page() {
  return <HomePage />;
}
```

Đảm bảo `src/app/layout.tsx` đã import global stylesheet:

```tsx
import "./globals.css";
```

Các import `@/` giả định dự án đã có alias trong `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## 3. Cấu trúc thư mục

```text
src/
├── app/
│   ├── globals.css             # CSS entry point Tailwind v4 (ở dự án của bạn)
│   └── page.tsx                # Render HomePage
├── components/
│   └── home/
│       ├── Header/Header.tsx
│       ├── HeroSection/HeroSection.tsx
│       ├── PromotionGrid/PromotionGrid.tsx
│       ├── ProductCard/ProductCard.tsx
│       ├── ProductSection/ProductSection.tsx
│       ├── CategoryGrid/CategoryGrid.tsx
│       ├── NewsSection/NewsSection.tsx
│       ├── Footer/Footer.tsx
│       ├── HomePage.tsx
│       └── types.ts
└── data/
    └── home-data.ts
```

Không có file `.scss` hoặc `.module.scss` trong bản Tailwind v4.

## 4. Tại sao chia component như vậy?

| Component | Trách nhiệm | Lý do tách riêng |
|---|---|---|
| `HomePage` | Ghép các section, quản lý cart demo | Page chỉ điều phối, không chứa markup khổng lồ |
| `Header` | Search, navigation, menu mobile, cart count | Có state tương tác riêng |
| `HeroSection` | Banner và cam kết dịch vụ | Một khối giao diện độc lập |
| `PromotionGrid` | Lối tắt khuyến mãi | Nội dung có thể thay đổi độc lập |
| `ProductSection` | Tiêu đề + danh sách sản phẩm | Dùng lại cho nhiều nhóm sản phẩm |
| `ProductCard` | Hiển thị một sản phẩm | Đóng gói cách trình bày dữ liệu Product |
| `CategoryGrid` | Danh mục nhanh | Tách dữ liệu danh mục khỏi phần sản phẩm |
| `NewsSection` | Bài viết/khuyến mãi | Có thể thay bằng API blog riêng |
| `Footer` | Chính sách và liên hệ | Dùng chung toàn website |

### Quy tắc senior cần nhớ

1. **Single responsibility:** mỗi component nên có một nhiệm vụ rõ ràng.
2. **Props down, events up:** `ProductSection` truyền `product` xuống `ProductCard`; hành động thêm giỏ được callback ngược lên `HomePage`.
3. **Data/UI separation:** `home-data.ts` chứa dữ liệu; component tập trung render.
4. **Typed contracts:** `Product` và `ProductSectionData` giúp TypeScript kiểm tra hợp đồng giữa các component.
5. **State gần nơi sử dụng:** state menu nằm trong `Header`; cart count demo nằm ở `HomePage` vì Header và ProductCard đều cần tương tác với nó.
6. **Responsive mobile-first:** class mặc định áp dụng cho mobile; `sm:`, `md:`, `lg:`, `xl:` ghi đè ở màn hình lớn hơn.
7. **Semantic HTML:** dùng `header`, `main`, `section`, `article`, `nav`, `footer`, button cho hành động và anchor cho điều hướng.

## 5. Đọc Tailwind CSS v4 trong code

Ví dụ:

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
  {/* ProductCard */}
</div>
```

- `grid`: bật CSS Grid.
- `grid-cols-2`: 2 cột ở mobile (mặc định).
- `gap-3`: khoảng cách giữa các ô.
- `sm:grid-cols-3`: từ breakpoint `sm` trở lên chuyển thành 3 cột.
- `lg:grid-cols-5`: từ breakpoint `lg` trở lên chuyển thành 5 cột.

Một số pattern được dùng xuyên suốt:

- `mx-auto max-w-[1440px]`: căn giữa và giới hạn chiều rộng nội dung.
- `min-w-0 flex-1`: cho phép phần tử flex co lại, tránh input tràn.
- `group` + `group-hover:*`: hover một phần tử cha để thay đổi phần tử con.
- `focus-within:*`: style wrapper khi input bên trong được focus.
- `line-clamp-2`: giới hạn nội dung tối đa 2 dòng (nếu utility được bật trong phiên bản Tailwind của dự án).
- `sm:*`, `md:*`, `lg:*`, `xl:*`: responsive variants.

Không nên tạo một class CSS riêng cho từng component nếu utility classes đã diễn đạt rõ ràng. Nếu một pattern dài và lặp lại nhiều nơi, cân nhắc component dùng lại trước khi trích thành CSS tùy chỉnh.

## 6. Dữ liệu và tích hợp NestJS

Dữ liệu demo nằm trong `src/data/home-data.ts`:

- `homeCategories`: danh mục hiển thị ở trang chủ.
- `productSections`: các nhóm sản phẩm.
- `promotionPosts`: bài viết/khuyến mãi.

Khi nối backend, nên tạo lớp API/service riêng, ví dụ `src/services/product.service.ts`, để gọi NestJS. Không gọi API lặp lại bên trong từng `ProductCard`. Có thể lấy dữ liệu trong Server Component rồi truyền xuống component hiển thị; chỉ giữ Client Component ở phần thực sự cần tương tác.

`HomePage` hiện là Client Component vì cart demo và toast dùng state. `handleAddToCart` chỉ tăng số lượng ở local state, chưa gọi Cart API. Khi tích hợp thật:

- Chuyển cart state sang Context/Zustand hoặc giải pháp state phù hợp.
- Gọi endpoint Cart của NestJS từ một service.
- Đồng bộ số lượng giỏ hàng theo user/session.
- Xử lý loading, lỗi, tồn kho và chống thêm sản phẩm vượt số lượng cho phép.

## 7. Việc cần hoàn thiện trước production

1. Thay ảnh Unsplash bằng ảnh sản phẩm từ storage/CDN của dự án.
2. Thay giá, tồn kho, khuyến mãi, đánh giá và thông số bằng API thật.
3. Thay các anchor placeholder bằng route thực tế; cân nhắc `next/link` cho điều hướng nội bộ.
4. Tích hợp Auth, Search, Wishlist, Cart và newsletter.
5. Bổ sung loading skeleton, error state, empty state, SEO metadata và kiểm tra accessibility.
6. Cân nhắc `next/image` và khai báo `remotePatterns` cho domain ảnh khi chuyển sang Image Optimization.
7. Kiểm tra keyboard navigation, focus state, tương phản màu và responsive ở các viewport thực tế.

## 8. Chạy dự án

```bash
npm run dev
```

Sau đó mở `http://localhost:3000`.
