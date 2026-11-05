import type { PromotionCampaign } from "@/src/components/sections/ProductPromotionSection/ProductPromotionSection";

const monitorProducts = [
  {
    id: 1,
    name: "Màn hình Đồ họa ASUS ProArt PA249CGV | 24 inch",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    alt: "ASUS ProArt PA249CGV",
    price: 5290000,
    oldPrice: 0,
    specs: ["▣ 24 inch", "▱ Full HD", "▰ IPS", "◉ 144Hz", "◌ 5ms (GTG)"],
  },
  {
    id: 2,
    name: "Màn hình Văn phòng Asus ASUS PA278QGV | 27 inch",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    alt: "ASUS PA278QGV",
    price: 7790000,
    specs: ["▣ 27 inch", "▱ 2K/QHD", "▰ IPS", "◉ 120Hz"],
  },
  {
    id: 3,
    name: "Màn hình đồ họa ASUS ProArt PA248QFV | 24 inch",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    alt: "ASUS PA248QFV",
    price: 4490000,
    specs: ["▣ 24 inch", "▱ Full HD", "▰ IPS", "◉ 100Hz", "◌ 5ms"],
  },
  {
    id: 4,
    name: "Màn hình Đồ họa ASUS ProArt PA278CGRV | 27 inch",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    alt: "ASUS PA278CGRV",
    price: 8290000,
    specs: ["▣ 27 inch", "▱ 2K/QHD", "▰ IPS", "◉ 144Hz", "◌ 5ms"],
  },
  {
    id: 5,
    name: "Màn hình Đồ họa 4K Asus ProArt PA279CV",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    alt: "ASUS PA279CV",
    price: 10790000,
    specs: ["▣ 27 inch", "▱ UHD", "▰ IPS", "◉ 60Hz", "◌ 5ms"],
  },
  {
    id: 6,
    name: "Màn hình Đồ họa ASUS ProArt PA279CRV | 27 inch",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    alt: "ASUS PA279CRV",
    price: 12590000,
    specs: ["▣ 27 inch", "▱ 4K/UHD", "▰ IPS", "◉ 60Hz", "◌ 5ms"],
  },
];

export const monitorCampaigns: PromotionCampaign[] = [
  {
    id: "pc",

    eyebrow: "PC QUỐC DÂN",
    badge: "TỪ 15TR",

    bannerImage: "/images/services/service-promo-bottom.webp",
    bannerAlt: "Ưu đãi PC quốc dân",

    moreText: "Xem thêm PC Gaming Quốc Dân",
    moreHref: "/khuyen-mai/pc-quoc-dan",

    products: monitorProducts,
  },
  {
    id: "proart",

    eyebrow: "LCD ASUS PROART",
    badge: "GIẢM 1TR",

    bannerImage: "/images/services/service-promo-bottom.webp",
    bannerAlt: "Khuyến mãi màn hình ASUS ProArt",

    moreText: "Xem thêm Khuyến mãi Màn hình 2K ProArt",
    moreHref: "/khuyen-mai/man-hinh-proart",

    products: monitorProducts,
  },
  {
    id: "nuc",

    eyebrow: "MINI PC ASUS NUC",
    badge: "GIẢM ĐẾN 1.7TR",

    bannerImage: "/images/services/service-promo-bottom.webp",
    bannerAlt: "Ưu đãi Mini PC ASUS NUC",

    moreText: "Xem thêm Mini PC ASUS NUC",
    moreHref: "/khuyen-mai/asus-nuc",

    products: monitorProducts,
  },
  {
    id: "camera",

    eyebrow: "CAMERA SALE SỐC",
    badge: "GIẢM ĐẾN 50%",

    bannerImage: "/images/services/service-promo-bottom.webp",
    bannerAlt: "Khuyến mãi camera",

    moreText: "Xem thêm ưu đãi Camera",
    moreHref: "/khuyen-mai/camera",

    products: monitorProducts,
  },
];
