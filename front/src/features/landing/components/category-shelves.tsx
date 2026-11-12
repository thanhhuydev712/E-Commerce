"use client";

import { useCatalog } from "@/src/catalog/catalog-provider";
import { CategoryShelf } from "./category-shelf";

export function CategoryShelves() {
  const { shelves } = useCatalog().presentation;

  return shelves.map((shelf) => <CategoryShelf key={shelf.id} shelf={shelf} />);
}
