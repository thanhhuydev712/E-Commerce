# Ảnh biên tập Rigforge Spectrum — 17/11/2026

Hai ảnh được tạo bằng built-in `image_gen`, không dùng API/CLI fallback. Dùng cho hero/PC Studio và ảnh bìa minh họa trên landing; không thay ảnh SKU, không gắn giá hoặc thông số sản phẩm thật. Bản xuất WebP được tối ưu kích thước bằng Sharp đang có trong dependency Next, không thêm package. Không dùng ảnh tạo sinh để tuyên bố đây là cấu hình đã kiểm tra tương thích.

Hiển thị hero cập nhật 18/11/2026: giữ trọn ảnh PC 4:3 bằng `object-contain`, giới hạn kích thước desktop theo chiều cao viewport sau khi chừa header/caption/thanh dịch vụ. Mobile giữ ảnh đúng tỷ lệ và chiều cao nội dung tự nhiên. Hiệu ứng zoom khi hover/focus được giữ; không cắt ảnh tĩnh để ép khung thấp hơn.

| File trong workspace | Kích thước | Dung lượng |
| --- | --- | --- |
| `front/public/images/forge-spectrum-pc.webp` | 1440 × 1080 | 172.816 byte |
| `front/public/images/forge-spectrum-components.webp` | 1200 × 900 | 183.018 byte |

## Prompt ảnh PC

```text
Create a high-end editorial product photograph / 3D campaign visual for a creative PC hardware storefront. Single spectacular premium white panoramic glass desktop PC in three-quarter front view, meticulously assembled, three RGB intake fans and a liquid-cooled build, beautiful violet and electric cyan interior lighting. White gaming keyboard and elegant wireless mouse in foreground on a glossy subtly reflective violet platform, tiny coral detail accents. Editorial studio background with deep indigo on left and rich violet on right, sweeping soft cyan light on the right, a single coral light disc glow softly behind the computer. Physical realistic premium materials, crisp glass, balanced shadows, beautiful sophisticated hardware advertising, photographic not illustration or diagram. No logos, brand names, numbers, labels, lettering or typography of any kind. Main PC tower fills the frame attractively, whole tower visible without cropping, clean composition with room for a small UI caption at bottom. Landscape 4:3 image, this will be used in the right half of a website hero with text in separate HTML to its left. Output a polished photo visual asset, no website mockup or screenshot. This is an aspirational generic build illustration, not a photo of a particular real SKU.
```

## Prompt ảnh linh kiện

```text
Premium editorial photograph for a custom PC configurator website. An artfully arranged flat lay of high-end computer components on a vivid electric cyan and deep violet two-tone studio surface: large elegant silver and black triple-fan graphics card, beautifully detailed dark motherboard, two white RGB RAM sticks, a small silver CPU, and a white circular liquid-cooler pump with braided tubing. Components placed thoughtfully at slight diagonal angles, generous clean space around objects, all fully in frame. Rich violet and coral rim lighting gives sculptural depth, crisp realistic materials and dramatic soft shadows, polished top-tier hardware advertising campaign. Modern high-end still life, editorial macro clarity. No text, no words, no badges, no numbers, no brand logos or retail packaging. No computers rendered as drawings, no infographic or website mockup. Landscape 4:3 crop with central arrangement that remains legible when cropped slightly for a banner. Illustration of a generic aspirational set of PC components; do not imitate a specific branded SKU.
```

Các ảnh danh mục được chọn lại từ tài nguyên local hiện có, chỉ đại diện nhóm hàng. Card sản phẩm có giá vẫn dùng `product.image` của catalog. Khối đối tác lấy tên thương hiệu từ presentation/catalog và ghi rõ bản demo; chưa xác minh quan hệ phân phối hoặc đối tác chiến lược thực tế.
