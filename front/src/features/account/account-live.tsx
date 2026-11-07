"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useShop } from "@/src/providers/shop-provider";
import { useCatalog } from "@/src/catalog/catalog-provider";
import { api } from "@/src/catalog/api-client";
import { useApiResource } from "@/src/hooks/use-api-resource";
import { money } from "@/src/catalog/model";
import { Empty, ProductCard } from "@/src/components/storefront";
import { OrderDetail } from "@/src/features/orders/order-detail";
import { accountStyles as tw } from "./account-styles";
type Address = {
  id: string;
  recipientName: string;
  phone: string;
  line1: string;
  countryCode: string;
  isDefaultShipping: boolean;
};
type Ticket = {
  id: string;
  number: string;
  subject: string;
  status: string;
  supportMessages: { id: string; body: string }[];
};
type Notification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
};
type Review = {
  id: string;
  body: string;
  rating: number;
  status: string;
  product: { name: string };
};
type Session = {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  isCurrent?: boolean;
};
const navigation = [
  ["", "Tổng quan"],
  ["orders", "Đơn hàng của tôi"],
  ["profile", "Thông tin cá nhân"],
  ["addresses", "Sổ địa chỉ"],
  ["wishlist", "Sản phẩm yêu thích"],
  ["reviews", "Đánh giá của tôi"],
  ["returns", "Đổi trả & hoàn tiền"],
  ["warranties", "Bảo hành"],
  ["support", "Yêu cầu hỗ trợ"],
  ["notifications", "Thông báo"],
  ["security", "Bảo mật & phiên"],
];
export default function AccountPage({ segments }: { segments: string[] }) {
  const shop = useShop(),
    { products } = useCatalog();
  const [section = "", id, detail] = segments;
  if (!shop.ready) return <p role="status">Đang khôi phục tài khoản…</p>;
  if (!shop.user)
    return (
      <Empty
        title="Vui lòng đăng nhập"
        href="/login?next=/account"
        label="Đăng nhập"
      />
    );
  let content: ReactNode;
  if (section === "orders" && id)
    content = <OrderDetail id={id} section={detail} />;
  else if (section === "orders")
    content = (
      <>
        <h1>Đơn hàng của tôi</h1>
        {!shop.orders.length ? (
          <Empty title="Chưa có đơn hàng" />
        ) : (
          shop.orders.map((order) => (
            <article key={order.id} className={tw.order_card_panel}>
              <strong>{order.number}</strong>
              <p>
                {order.backendStatus} · {money(order.total)}
              </p>
              <Link href={`/account/orders/${order.id}`}>Xem chi tiết</Link>
            </article>
          ))
        )}
      </>
    );
  else if (section === "profile") content = <Profile />;
  else if (section === "addresses") content = <Addresses />;
  else if (section === "wishlist")
    content = (
      <>
        <h1>Sản phẩm yêu thích</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {products
            .filter((p) => shop.wishlist.includes(p.id))
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
        {!shop.wishlist.length && <Empty title="Chưa có sản phẩm yêu thích" />}
      </>
    );
  else if (["support", "returns", "warranties"].includes(section))
    content = <Support section={section} id={id} />;
  else if (["notifications", "preferences"].includes(section))
    content = <Notifications />;
  else if (["security", "sessions"].includes(section)) content = <Security />;
  else if (section === "reviews") content = <Reviews />;
  else
    content = (
      <>
        <h1>Xin chào, {shop.user.name}</h1>
        <p>Dữ liệu được đồng bộ với tài khoản của bạn.</p>
        <div className={tw.account_stats}>
          <Link href="/account/orders">
            <strong>{shop.orders.length}</strong>
            <span>Đơn hàng</span>
          </Link>
          <Link href="/account/wishlist">
            <strong>{shop.wishlist.length}</strong>
            <span>Yêu thích</span>
          </Link>
          <Link href="/pc-builder/saved">
            <strong>{shop.builds.length}</strong>
            <span>Cấu hình đã lưu</span>
          </Link>
        </div>
      </>
    );
  return (
    <div className="rf-account-layout grid gap-6 py-8 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className={tw.panel}>
        <h2>Tài khoản của tôi</h2>
        <nav className="grid gap-3">
          {navigation.map(([key, label]) => (
            <Link
              key={key}
              href={`/account${key ? "/" + key : ""}`}
              aria-current={section === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <button onClick={() => void shop.logout()}>Đăng xuất</button>
        </nav>
      </aside>
      <div className="min-w-0">{content}</div>
    </div>
  );
}
function Profile() {
  const shop = useShop();
  const [name, setName] = useState(shop.user?.name ?? ""),
    [phone, setPhone] = useState(shop.user?.phone ?? "");
  return (
    <section className={tw.panel}>
      <h1>Thông tin cá nhân</h1>
      <form
        className={tw.form}
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await api("/me", {
              method: "PATCH",
              body: { firstName: name, lastName: null, phone },
            });
            await shop.refreshAccount();
            shop.notify("Đã lưu hồ sơ");
          } catch (error) {
            shop.notify((error as Error).message);
          }
        }}
      >
        <label>
          Tên hiển thị
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Email
          <input readOnly value={shop.user?.email ?? ""} />
        </label>
        <label>
          Số điện thoại
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={32}
          />
        </label>
        <button className={tw.btn}>Lưu thay đổi</button>
      </form>
    </section>
  );
}
function Addresses() {
  const shop = useShop(),
    { data, error, reload } = useApiResource<Address[]>("/me/addresses");
  const [editing, setEditing] = useState<string | null>(null),
    [recipient, setRecipient] = useState(""),
    [phone, setPhone] = useState(""),
    [line, setLine] = useState("");
  return (
    <section className={tw.panel}>
      <h1>Sổ địa chỉ</h1>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Đang tải…</p>}
      {data?.map((address) => (
        <article className="my-4 rounded border p-4" key={address.id}>
          <strong>{address.recipientName}</strong>
          <p>
            {address.phone} · {address.line1}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditing(address.id);
              setRecipient(address.recipientName);
              setPhone(address.phone);
              setLine(address.line1);
            }}
          >
            Sửa địa chỉ
          </button>
          <button
            type="button"
            onClick={() =>
              void api(`/me/addresses/${address.id}`, { method: "DELETE" })
                .then(reload)
                .catch((e) => shop.notify(e.message))
            }
          >
            Xóa địa chỉ
          </button>
        </article>
      ))}
      <h2>{editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h2>
      <form
        className={tw.form}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/me/addresses" + (editing ? "/" + editing : ""), {
              method: editing ? "PATCH" : "POST",
              body: {
                recipientName: recipient,
                phone,
                countryCode: "VN",
                line1: line,
              },
            });
            setEditing(null);
            setRecipient("");
            setPhone("");
            setLine("");
            reload();
            shop.notify("Đã lưu địa chỉ");
          } catch (cause) {
            shop.notify((cause as Error).message);
          }
        }}
      >
        <label>
          Người nhận
          <input
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </label>
        <label>
          Số điện thoại
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label>
          Địa chỉ
          <input
            required
            value={line}
            onChange={(e) => setLine(e.target.value)}
          />
        </label>
        <button className={tw.btn}>Lưu địa chỉ</button>
      </form>
    </section>
  );
}
function Support({ section, id }: { section: string; id?: string }) {
  const shop = useShop(),
    { data, error, reload } = useApiResource<Ticket[]>("/me/support");
  const [subject, setSubject] = useState(""),
    [body, setBody] = useState("");
  const tickets = id ? data?.filter((t) => t.id === id) : data;
  return (
    <section className={tw.panel}>
      <h1>
        {section === "warranties"
          ? "Bảo hành"
          : section === "returns"
            ? "Đổi trả & hoàn tiền"
            : "Yêu cầu hỗ trợ"}
      </h1>
      {section !== "support" && (
        <p>
          Gửi thông tin để được kiểm tra điều kiện; tạo yêu cầu hỗ trợ không
          đồng nghĩa đã được duyệt đổi trả, bảo hành hoặc hoàn tiền.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {tickets?.map((ticket) => (
        <article key={ticket.id} className="my-4 border p-4">
          <Link href={`/account/support/${ticket.id}`}>
            {ticket.number} · {ticket.subject}
          </Link>
          <p>{ticket.status}</p>
          {ticket.supportMessages.map((message) => (
            <p key={message.id}>{message.body}</p>
          ))}
        </article>
      ))}
      <form
        className={tw.form}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/me/support", {
              method: "POST",
              body: {
                subject: `${section === "support" ? "" : section + ": "}${subject}`,
                body,
              },
            });
            setSubject("");
            setBody("");
            reload();
            shop.notify("Đã gửi yêu cầu tới bộ phận hỗ trợ");
          } catch (cause) {
            shop.notify((cause as Error).message);
          }
        }}
      >
        <label>
          Tiêu đề
          <input
            required
            minLength={3}
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label>
          Nội dung
          <textarea
            required
            minLength={5}
            maxLength={5000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button className={tw.btn}>Gửi yêu cầu</button>
      </form>
    </section>
  );
}
function Notifications() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [savingPreference, setSavingPreference] = useState(false);
  const shop = useShop(),
    list = useApiResource<Notification[]>("/me/notifications"),
    preference = useApiResource<{ enabled: boolean } | null>("/me/preferences");
  return (
    <section className={tw.panel}>
      <h1>Thông báo</h1>
      {list.error && <p role="alert">{list.error}</p>}
      {list.data?.map((n) => (
        <article className="my-4 border p-4" key={n.id}>
          <strong>{n.title}</strong>
          <p>{n.body}</p>
          <span>{n.readAt ? "Đã đọc" : "Chưa đọc"}</span>
        </article>
      ))}
      {list.data?.length === 0 && <p>Chưa có thông báo.</p>}
      <button
        onClick={() =>
          void api("/me/notifications/read", { method: "POST" })
            .then(list.reload)
            .catch((e) => shop.notify(e.message))
        }
      >
        Đánh dấu đã đọc
      </button>
      <label className="mt-6 flex gap-2">
        <input
          type="checkbox"
          checked={enabled ?? preference.data?.enabled ?? false}
          disabled={savingPreference}
          onChange={async (e) => {
            const next = e.target.checked;
            setEnabled(next);
            setSavingPreference(true);
            try {
              await api("/me/preferences", {
                method: "PUT",
                body: { enabled: next },
              });
              preference.reload();
              shop.notify("Đã lưu lựa chọn nhận ưu đãi");
            } catch (error) {
              setEnabled(null);
              shop.notify((error as Error).message);
            } finally {
              setSavingPreference(false);
            }
          }}
        />
        Nhận email ưu đãi khi dịch vụ email được triển khai
      </label>
    </section>
  );
}
function Security() {
  const router = useRouter(),
    shop = useShop(),
    sessions = useApiResource<Session[]>("/me/sessions");
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState("");
  return (
    <section className={tw.panel}>
      <h1>Bảo mật & phiên đăng nhập</h1>
      {sessions.error && <p role="alert">{sessions.error}</p>}
      {sessions.data?.map((session) => (
        <div className="my-3 flex justify-between gap-3" key={session.id}>
          <span>
            {session.deviceLabel || "Trình duyệt"} ·{" "}
            {new Date(session.createdAt).toLocaleString("vi-VN")}
          </span>
          <button
            onClick={() =>
              void api(`/me/sessions/${session.id}`, { method: "DELETE" })
                .then(() => router.replace("/login"))
                .catch((e) => shop.notify(e.message))
            }
          >
            Thu hồi phiên
          </button>
        </div>
      ))}
      <form
        className={tw.form}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/me/password", {
              method: "PATCH",
              body: { currentPassword: current, newPassword: password },
            });
            shop.expireSession();
            shop.notify("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
            router.replace("/login");
          } catch (cause) {
            shop.notify((cause as Error).message);
          }
        }}
      >
        <label>
          Mật khẩu hiện tại
          <input
            required
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            required
            type="password"
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className={tw.btn}>Đổi mật khẩu và đăng xuất các phiên</button>
      </form>
    </section>
  );
}
function Reviews() {
  const { data, error, reload } = useApiResource<Review[]>("/me/reviews"),
    shop = useShop();
  const [item, setItem] = useState(""),
    [body, setBody] = useState(""),
    [rating, setRating] = useState(5);
  const eligible = shop.orders
    .filter((order) => order.backendStatus === "COMPLETED")
    .flatMap((order) => order.lines);
  return (
    <section className={tw.panel}>
      <h1>Đánh giá của tôi</h1>
      {error && <p role="alert">{error}</p>}
      {data?.map((review) => (
        <article key={review.id}>
          <strong>
            {review.product.name} · {review.rating}/5
          </strong>
          <p>
            {review.body} · {review.status}
          </p>
        </article>
      ))}
      {eligible.length ? (
        <form
          className={tw.form}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/me/reviews", {
                method: "POST",
                body: { orderItemId: item || eligible[0].id, rating, body },
              });
              setBody("");
              reload();
            } catch (cause) {
              shop.notify((cause as Error).message);
            }
          }}
        >
          <label>
            Sản phẩm đã mua
            <select
              value={item || eligible[0].id}
              onChange={(e) => setItem(e.target.value)}
            >
              {eligible.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số sao
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <textarea
            required
            minLength={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className={tw.btn}>Gửi đánh giá</button>
        </form>
      ) : (
        <p>Chỉ các đơn đã hoàn thành mới có thể gửi đánh giá.</p>
      )}
    </section>
  );
}
