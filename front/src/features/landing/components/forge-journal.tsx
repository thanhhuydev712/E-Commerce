"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCatalog } from "@/src/catalog/catalog-provider";
import type { Article } from "@/src/catalog/model";

function editorialImage(article: Article) {
  if (/đơn hàng|bảo hành/i.test(article.title))
    return {
      src: "/images/forge-spectrum-pc.webp",
      alt: "PC trắng và bộ bàn phím chuột RGB minh họa",
      position: "object-center",
    };
  if (/DDR|RAM|bộ nhớ/i.test(article.title))
    return {
      src: "/images/forge-spectrum-components.webp",
      alt: "RAM và linh kiện máy tính trên nền tím cyan minh họa",
      position: "object-[32%_66%]",
    };
  if (/linh kiện|thông số|CPU|GPU|SSD|nguồn/i.test(article.title))
    return {
      src: "/images/forge-spectrum-components.webp",
      alt: "Card đồ họa, bo mạch và linh kiện máy tính minh họa",
      position: "object-[70%_45%]",
    };
  return {
    src: "/images/forge-spectrum-pc.webp",
    alt: "PC trắng cùng bàn phím và chuột RGB minh họa góc máy",
    position: "object-[50%_60%]",
  };
}

function ArticleCard({
  article,
  featured,
}: {
  article: Article;
  featured: boolean;
}) {
  // Landing chọn ảnh biên tập theo chủ đề; nội dung và đường dẫn vẫn từ API.
  const image = editorialImage(article);

  return (
    <article
      className={`rf-forge-article min-w-0 ${featured ? "lg:row-span-2" : ""}`}
    >
      <Link
        href={`/articles/${article.id}`}
        className={`group grid h-full min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] overflow-hidden rounded-2xl border border-rf-border bg-rf-surface transition-[border-color,box-shadow,translate] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1 motion-safe:focus-within:-translate-y-1 hover:border-rf-accent/60 hover:shadow-[0_8px_28px_#6334e312] focus-visible:border-rf-accent motion-reduce:transition-none ${featured ? "lg:flex lg:flex-col" : ""}`}
      >
        <div
          className={`rf-forge-article-image relative min-h-36 overflow-hidden bg-rf-accent-soft ${featured ? "lg:min-h-60 lg:flex-1 xl:min-h-72" : "sm:min-h-44"}`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={
              featured
                ? "(max-width: 1023px) 34vw, (max-width: 1600px) 45vw, 730px"
                : "(max-width: 1023px) 34vw, (max-width: 1600px) 19vw, 300px"
            }
            className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08] group-focus-within:scale-[1.08] motion-reduce:transition-none ${image.position}`}
          />
          <span className="absolute bottom-2 left-2 rounded bg-white/85 px-2 py-1 font-mono text-[0.625rem] tracking-[0.08em] text-rf-ink sm:bottom-3 sm:left-3">
            Ảnh minh họa
          </span>
        </div>
        <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6">
          <p className="mb-2 text-rf-caption leading-relaxed font-semibold tracking-[0.08em] text-rf-accent">
            {article.tag}
          </p>
          <h3
            className={`mb-3 leading-snug font-semibold tracking-tight text-rf-ink ${featured ? "text-lg sm:text-xl lg:text-2xl" : "text-lg sm:text-xl"}`}
          >
            {article.title}
          </h3>
          <p className="mb-4 hidden text-rf-small leading-relaxed text-rf-muted sm:line-clamp-2">
            {article.content}
          </p>
          <span className="mt-auto inline-flex items-center gap-2 text-rf-caption font-semibold text-rf-accent">
            Đọc bài viết <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}

/** Ba bài đầu từ snapshot public; không thay bài viết bằng dữ liệu giả khi trống. */
export function ForgeJournal() {
  const { articles } = useCatalog();
  const visible = articles.slice(0, 3);

  return (
    <section
      className="rf-forge-journal"
      aria-labelledby="forge-journal-heading"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 md:mb-6">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-rf-caption tracking-[0.16em] text-rf-accent">
            RIGFORCE JOURNAL
          </p>
          <h2
            id="forge-journal-heading"
            className="mb-0 text-3xl leading-tight font-semibold tracking-tight lg:text-4xl"
          >
            Góc máy. Góc nhìn.
          </h2>
        </div>
        <Link
          href="/articles"
          className="inline-flex min-h-11 items-center gap-3 rounded-lg px-1 text-rf-small font-semibold text-rf-accent! hover:text-rf-accent-hover!"
        >
          Xem tất cả bài viết <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {visible.length ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:gap-5">
          {visible.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              featured={index === 0}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-2xl border border-rf-border bg-rf-surface p-6 text-rf-body leading-relaxed text-rf-muted">
          Chưa có bài viết để hiển thị. Bạn có thể quay lại góc công nghệ sau.
        </p>
      )}
    </section>
  );
}
