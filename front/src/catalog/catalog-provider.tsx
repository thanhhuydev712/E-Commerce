"use client";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api-client";
import type { StorefrontSnapshot } from "./model";
function createCatalog(data: StorefrontSnapshot) {
  const productById = (id: string) => data.products.find((p) => p.id === id);
  const variantById = (id: string) =>
    data.products
      .flatMap((product) =>
        product.variants.map((variant) => ({ product, variant })),
      )
      .find((row) => row.variant.id === id);
  return {
    ...data,
    productById,
    variantById,
    totalOf: (lines: { variantId: string; quantity: number }[]) =>
      lines.reduce(
        (sum, line) =>
          sum +
          BigInt(variantById(line.variantId)?.variant.price ?? "0") *
            BigInt(line.quantity),
        BigInt(0),
      ),
    presentation: {
      ...data.presentation,
      featuredDeals: data.presentation.featuredDeals.flatMap((id) => {
        const p = productById(id);
        return p ? [p] : [];
      }),
      upgradeProducts: data.presentation.upgradeProducts.flatMap((id) => {
        const p = productById(id);
        return p ? [p] : [];
      }),
    },
    informationPages: Object.fromEntries(
      data.pages.map((page) => [
        page.slug,
        { title: page.title, paragraphs: page.body.paragraphs },
      ]),
    ),
  };
}
type Catalog = ReturnType<typeof createCatalog> & {
  refreshCatalog: () => Promise<void>;
};
const Context = createContext<Catalog | null>(null);
export function CatalogProvider({
  initialData,
  children,
}: {
  initialData: StorefrontSnapshot;
  children: ReactNode;
}) {
  const [data, setData] = useState(initialData);
  const refreshVersion = useRef(0);
  const catalog = useMemo(
    () => ({
      ...createCatalog(data),
      refreshCatalog: async () => {
        const version = ++refreshVersion.current;
        const updated = await api<StorefrontSnapshot>("/storefront");
        if (version === refreshVersion.current) setData(updated);
      },
    }),
    [data],
  );
  return <Context.Provider value={catalog}>{children}</Context.Provider>;
}
export function useCatalog() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing CatalogProvider");
  return value;
}
