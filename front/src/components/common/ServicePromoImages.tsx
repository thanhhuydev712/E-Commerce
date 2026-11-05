import Image from "next/image";
import Link from "next/link";

type PromoImageItem = {
  id: number;
  image: string;
  alt: string;
  href?: string;
};

// 4 ảnh dịch vụ phía trên
const serviceImages: PromoImageItem[] = [
  {
    id: 1,
    image: "/images/services/service-1.webp",
    alt: "PC bảo hành vàng",
  },
  {
    id: 2,
    image: "/images/services/service-2.webp",
    alt: "Vệ sinh laptop PC miễn phí",
  },
  {
    id: 3,
    image: "/images/services/service-3.webp",
    alt: "Miễn phí lắp đặt",
  },
  {
    id: 4,
    image: "/images/services/service-4.webp",
    alt: "Miễn phí giao hàng",
  },
];

// Ảnh quảng cáo phía dưới
const bottomPromo: PromoImageItem = {
  id: 5,
  image: "/images/services/service-promo-bottom.webp",
  alt: "Chương trình ưu đãi",
};

export default function ServicePromoImages() {
  return (
    <section className="w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* 4 ảnh dịch vụ */}
      <div
        className="
           grid grid-cols-2
    gap-2
    sm:gap-3
    lg:gap-4
    xl:grid-cols-4
    xl:gap-4
        "
      >
        {serviceImages.map((item, index) => {
          const imageContent = (
            <Image
              src={item.image}
              alt={item.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 767px) 100vw, 50vw"
              draggable={false}
              className="
                object-contain
                transition-transform duration-300
                group-hover:scale-[1.02]
              "
            />
          );

          return (
            <div
              key={item.id}
              className="
                 group relative
    aspect-[2.47/1]
    w-full min-w-0
    overflow-hidden
    rounded-lg sm:rounded-xl
    bg-gray-100
              "
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className="absolute inset-0 block"
                  aria-label={item.alt}
                >
                  {imageContent}
                </Link>
              ) : (
                imageContent
              )}
            </div>
          );
        })}
      </div>

      {/* Ảnh quảng cáo phía dưới */}
      <div className="relative w-full min-w-0 overflow-hidden rounded-xl bg-gray-100 aspect-[17.8/1]">
        <Image
          src={bottomPromo.image}
          alt={bottomPromo.alt}
          fill
          sizes="100vw"
          draggable={false}
          className="object-contain"
        />
      </div>
    </section>
  );
}
