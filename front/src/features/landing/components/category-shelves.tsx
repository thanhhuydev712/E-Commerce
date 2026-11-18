"use client";

import { useCatalog } from "@/src/catalog/catalog-provider";
import { CategoryShelf } from "./category-shelf";

export function CategoryShelves() {
  const { shelves } = useCatalog().presentation;

  // Trang chủ tuyển ba nhóm đầu; CatalogDirectory bên dưới giữ đủ danh mục.
  return shelves.slice(0, 3).map((shelf, index) => (
    <div key={shelf.id}>
      <div className="mt-12 flex items-baseline gap-4 border-t border-rf-border pt-7 md:mt-20">
        <span className="font-mono text-rf-body text-rf-green">
          0{index + 1} /
        </span>
        <h2 className="m-0 text-2xl font-bold tracking-tight md:text-4xl">
          {shelf.label}
        </h2>
      </div>
      <CategoryShelf shelf={shelf} />
    </div>
  ));
}
