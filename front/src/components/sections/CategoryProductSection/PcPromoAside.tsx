import Image from "next/image";

export default function PcPromoAside() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <Image
        src="/images/promotions/pc-aside.webp"
        alt="PC khuyến mãi"
        fill
        sizes="(max-width: 1023px) 100vw, 25vw"
        className="object-contain"
      />
    </div>
  );
}
