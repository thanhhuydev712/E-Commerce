import { ProductCard, SectionTitle } from "@/src/components/storefront";
import type { Product } from "@/src/catalog/model";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  product_grid_grid_five: [
    "rf-product-grid rf-grid-five grid grid-cols-[repeat(5,_minmax(0,_1fr))] gap-3.25",
    "max-[1200px]:grid-cols-[repeat(5,_minmax(0,_1fr))] max-[1200px]:gap-2.25",
    "max-[1024px]:grid-cols-[repeat(3,_minmax(0,_1fr))] max-[1024px]:gap-3",
    "max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[768px]:gap-2.25",
    "max-[1024px]:[&>.rf-product-card:nth-child(n+4)]:hidden max-[768px]:[&>.rf-product-card:nth-child(n+4)]:block",
    "max-[768px]:[&>.rf-product-card:last-child:nth-child(odd)]:hidden",
  ].join(" "),
};

type ProductCollectionProps = {
  title: string;
  eyebrow?: string;
  href: string;
  products: Product[];
};

/** Section nhận sẵn danh sách: dùng lại cho homepage, collection hoặc chiến dịch. */
export function ProductCollection({
  title,
  eyebrow,
  href,
  products,
}: ProductCollectionProps) {
  return (
    <section className="rf-section mt-11 max-[768px]:mt-8">
      <SectionTitle title={title} eyebrow={eyebrow} href={href} />
      <div className={tw.product_grid_grid_five}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
