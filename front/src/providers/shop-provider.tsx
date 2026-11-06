"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  refreshSession,
  setAccessToken,
} from "@/src/catalog/api-client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import type { Build } from "@/src/features/pc-builder/lib/compatibility";
export type CartLine = { variantId: string; quantity: number };
export type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: "processing" | "cancelled";
  backendStatus: string;
  payment: "paid" | "pending" | "failed";
  lines: {
    id: string;
    name: string;
    variantId: string;
    price: string;
    quantity: number;
  }[];
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  address: string;
  customer: string;
  canCancel: boolean;
};
export type User = {
  id: string;
  name: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roleCodes: string[];
  permissions: string[];
};
type Account = Omit<User, "name">;
type Snapshot = {
  ready: boolean;
  toast: string;
  user: User | null;
  cart: CartLine[];
  orders: Order[];
  wishlist: string[];
  compare: string[];
  builds: { id: string; name: string; build: Build }[];
};
type CheckoutData = {
  customer: string;
  address: string;
  phone: string;
  payment: Order["payment"];
  couponCode?: string;
  express: boolean;
};
const userView = (user: Account): User => ({
  ...user,
  name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
});
function createStore(
  initialCatalog: ReturnType<typeof useCatalog>,
  navigate: (destination: string) => void,
) {
  let currentCatalog = initialCatalog;
  const catalog = () => currentCatalog;
  const server: Snapshot = {
    ready: false,
    toast: "",
    user: null,
    cart: [],
    orders: [],
    wishlist: [],
    compare: [],
    builds: [],
  };
  let state = server,
    initialization: Promise<void> | null = null,
    timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  let cartQueue = Promise.resolve(),
    placing: Promise<string | null> | null = null;
  let pending: { fingerprint: string; quoteId: string; key: string } | null =
    null;
  const emit = (update: Partial<Snapshot>) => {
    state = { ...state, ...update };
    listeners.forEach((fn) => fn());
  };
  const notify = (toast: string) => {
    clearTimeout(timer);
    emit({ toast });
    timer = setTimeout(() => emit({ toast: "" }), 4000);
  };
  const error = (cause: unknown) =>
    notify(
      cause instanceof Error
        ? cause.message
        : "Không thể kết nối backend. Vui lòng thử lại.",
    );
  const initialize = () => {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const compare = JSON.parse(
          localStorage.getItem("rigforge-compare-v2") ?? "[]",
        ) as unknown;
        if (
          Array.isArray(compare) &&
          compare.length <= 4 &&
          compare.every(
            (id) => typeof id === "string" && catalog().productById(id),
          )
        )
          emit({ compare });
      } catch {
        /* Preference hỏng không thay thế dữ liệu nghiệp vụ từ server. */
      }
      try {
        if (await refreshSession()) await loadPrivate();
      } catch (cause) {
        error(cause);
      } finally {
        emit({ ready: true });
      }
    })();
    return initialization;
  };
  const signedIn = async () => {
    if (!state.ready) await initialize();
    if (state.user) return true;
    notify("Vui lòng đăng nhập để tiếp tục.");
    navigate(
      "/login?next=" +
        encodeURIComponent(window.location.pathname + window.location.search),
    );
    return false;
  };
  async function loadPrivate() {
    const [user, cart, orders, wishlist, builds] = await Promise.all([
      api<Account>("/me"),
      api<{ lines: CartLine[] }>("/me/cart"),
      api<Order[]>("/me/orders"),
      api<string[]>("/me/wishlist"),
      api<Snapshot["builds"]>("/me/builds"),
    ]);
    emit({ user: userView(user), cart: cart.lines, orders, wishlist, builds });
  }
  const queueCart = (run: () => Promise<{ lines: CartLine[] }>) => {
    cartQueue = cartQueue
      .then(async () => {
        if (!(await signedIn())) return;
        const result = await run();
        emit({ cart: result.lines });
        notify("Đã cập nhật giỏ hàng");
      })
      .catch(error);
    return cartQueue;
  };
  return {
    setCatalog: (value: ReturnType<typeof useCatalog>) => {
      currentCatalog = value;
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => server,
    initialize,
    dispose: () => clearTimeout(timer),
    notify,
    login: async (data: {
      email: string;
      password: string;
      name?: string;
      register?: boolean;
    }) => {
      const result = await api<{ accessToken: string; user: Account }>(
        data.register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: {
            email: data.email,
            password: data.password,
            ...(data.register ? { firstName: data.name } : {}),
          },
        },
      );
      setAccessToken(result.accessToken);
      emit({ user: userView(result.user) });
      await loadPrivate();
      notify("Đăng nhập thành công");
    },
    logout: async () => {
      try {
        await api("/auth/logout", { method: "POST" });
        setAccessToken(null);
        emit({ user: null, cart: [], orders: [], wishlist: [], builds: [] });
      } catch (cause) {
        error(cause);
      }
    },
    refreshAccount: loadPrivate,
    add: (variantId: string, quantity = 1) =>
      queueCart(() =>
        api("/me/cart/items", {
          method: "POST",
          body: { variantId, quantity },
        }),
      ),
    addBuild: (build: Build) =>
      queueCart(() =>
        api("/me/cart/build", {
          method: "POST",
          body: {
            lines: Object.values(build).flatMap((id) => {
              const product = catalog().productById(id);
              return product
                ? [{ variantId: product.variants[0].id, quantity: 1 }]
                : [];
            }),
          },
        }),
      ),
    setQuantity: (variantId: string, quantity: number) =>
      queueCart(() =>
        api("/me/cart", {
          method: "PUT",
          body: { lines: [{ variantId, quantity }] },
        }),
      ),
    toggle: async (key: "wishlist" | "compare", id: string) => {
      if (key === "compare") {
        if (!catalog().productById(id)) return;
        if (!state.compare.includes(id) && state.compare.length >= 4) {
          notify("Chỉ so sánh tối đa 4 sản phẩm.");
          return;
        }
        const compare = state.compare.includes(id)
          ? state.compare.filter((value) => value !== id)
          : [...state.compare, id];
        emit({ compare });
        try {
          localStorage.setItem("rigforge-compare-v2", JSON.stringify(compare));
        } catch {}
        return;
      }
      if (!(await signedIn())) return;
      const product = catalog().productById(id);
      if (!product) return;
      try {
        emit({
          wishlist: await api<string[]>(`/me/wishlist/${product.databaseId}`, {
            method: "POST",
          }),
        });
      } catch (cause) {
        error(cause);
      }
    },
    placeOrder: (data: CheckoutData) => {
      if (placing) return placing;
      placing = (async () => {
        await cartQueue;
        if (!(await signedIn())) return null;
        const fingerprint = JSON.stringify([state.user?.id, state.cart, data]);
        try {
          if (!pending || pending.fingerprint !== fingerprint) {
            const quote = await api<{ id: string }>("/me/checkout/quote", {
              method: "POST",
              body: {
                customer: data.customer,
                address: data.address,
                phone: data.phone,
                express: data.express,
                couponCode: data.couponCode || undefined,
              },
            });
            pending = {
              fingerprint,
              quoteId: quote.id,
              key: crypto.randomUUID(),
            };
          }
          const order = await api<Order>("/me/orders", {
            method: "POST",
            body: { quoteId: pending.quoteId, method: "COD" },
            key: pending.key,
          });
          pending = null;
          emit({
            cart: [],
            orders: [order, ...state.orders.filter((o) => o.id !== order.id)],
          });
          await catalog().refreshCatalog().catch(error);
          notify("Đã tạo đơn hàng COD");
          return order.id;
        } catch (cause) {
          if (cause instanceof ApiError && cause.status === 409) pending = null;
          error(cause);
          return null;
        }
      })().finally(() => {
        placing = null;
      });
      return placing;
    },
    cancelOrder: async (id: string) => {
      try {
        const order = await api<Order>(`/me/orders/${id}/cancel`, {
          method: "POST",
        });
        emit({ orders: state.orders.map((o) => (o.id === id ? order : o)) });
        await catalog().refreshCatalog();
        notify("Đã hủy đơn và giải phóng tồn giữ");
      } catch (cause) {
        error(cause);
      }
    },
    retryPayment: async () =>
      notify("Thanh toán online chưa được bật; đơn COD vẫn chưa thanh toán."),
    saveBuild: async (name: string, build: Build) => {
      if (!(await signedIn())) return;
      try {
        const components = Object.fromEntries(
          Object.entries(build).flatMap(([slot, id]) => {
            const p = catalog().productById(id);
            return p ? [[slot, p.databaseId]] : [];
          }),
        );
        emit({
          builds: await api<Snapshot["builds"]>("/me/builds", {
            method: "POST",
            body: { name, components },
          }),
        });
        notify("Đã lưu cấu hình vào tài khoản");
      } catch (cause) {
        error(cause);
      }
    },
    deleteBuild: async (id: string) => {
      try {
        emit({
          builds: await api<Snapshot["builds"]>(`/me/builds/${id}`, {
            method: "DELETE",
          }),
        });
      } catch (cause) {
        error(cause);
      }
    },
  };
}
const Context = createContext<ReturnType<typeof createStore> | null>(null);
export function ShopProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog(),
    router = useRouter();
  const [store] = useState(() =>
    createStore(catalog, (destination) => router.push(destination)),
  );
  useEffect(() => {
    store.setCatalog(catalog);
  }, [catalog, store]);
  useEffect(() => {
    void store.initialize();
    return store.dispose;
  }, [store]);
  return (
    <Context.Provider value={store}>
      {children}
      <StoreToast />
    </Context.Provider>
  );
}
function StoreToast() {
  const { toast } = useShop();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rf-toast fixed bottom-7 left-1/2 z-200 max-w-[90vw] -translate-x-1/2 rounded-lg bg-rf-dark px-6 py-4 text-white shadow-xl transition-opacity ${toast ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {toast}
    </div>
  );
}
export function useShop() {
  const store = useContext(Context);
  if (!store) throw new Error("Missing ShopProvider");
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { ...store, ...snapshot };
}
