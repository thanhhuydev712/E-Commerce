"use client";
import type { Article } from "@/src/catalog/model";

import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_blog_journal_page: [
    "bg-white bg-none p-6 mx-0 my-10.5 rounded-[16px] max-[768px]:p-3 max-[768px]:mx-0 max-[768px]:my-7",
    "max-[768px]:rounded-[10px] [&.rf-journal-page_.rf-blog-toolbar]:flex-wrap [&.rf-journal-page_.rf-blog-toolbar]:flex",
    "[&.rf-journal-page_.rf-blog-toolbar_h1]:w-full [&.rf-journal-page_.rf-blog-toolbar_h1]:text-[20px]",
    "[&.rf-journal-page_.rf-blog-toolbar_h1]:text-rf-green [&.rf-journal-page_.rf-blog-toolbar_h1]:mb-2",
    "[&.rf-journal-page_.rf-blog-body]:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1fr)]",
    "[&.rf-journal-page_.rf-blog-body>*]:min-w-0 [&.rf-journal-page_.rf-blog-filters]:max-w-full",
    "[&.rf-journal-page_.rf-blog-filters]:overflow-x-auto [&.rf-journal-page_.rf-blog-toolbar_form]:w-full",
    "[&.rf-journal-page_.rf-blog-toolbar_form]:min-w-0 [&.rf-journal-page_.rf-blog-cover]:h-87.5",
    "[&.rf-journal-page_.rf-blog-cover]:[aspect-ratio:auto] max-[768px]:[&.rf-journal-page_.rf-blog-body]:grid-cols-[1fr]",
    "max-[768px]:[&.rf-journal-page_.rf-blog-cover]:h-57.5",
  ].join(" "),
  blog_toolbar: [
    "rf-blog-toolbar flex flex-wrap items-center bg-white bg-none shadow-[0_2px_15px_#102d3510] mb-6.25 p-5",
    "rounded-[10px] gap-3.75 [&_h2]:bg-rf-green [&_h2]:bg-none [&_h2]:text-white [&_h2]:text-[13px]",
    "[&_h2]:whitespace-nowrap [&_h2]:px-4.25 [&_h2]:py-3 [&_h2]:m-0 [&_h2]:rounded-[30px] [&_form]:ml-auto [&_form]:flex",
    "[&_form]:items-center [&_form]:relative [&_form]:w-76.25 [&_form]:mt-2.5 [&_input]:w-full [&_input]:h-10",
    "[&_input]:bg-[#f7f9fa] [&_input]:bg-none [&_input]:pr-10 [&_input]:pl-3.5 [&_input]:text-[12px] [&_input]:py-2",
    "[&_input]:border-[#e0e7e9] [&_input]:border-solid [&_input]:border [&_input]:rounded-[25px] [&_form_button]:absolute",
    "[&_form_button]:right-1.25 [&_form_button]:top-1.25 [&_form_button]:w-7.5 [&_form_button]:h-7.5",
    "[&_form_button]:bg-rf-green [&_form_button]:bg-none [&_form_button]:text-white [&_form_button]:grid",
    "[&_form_button]:place-items-center [&_form_button]:border-current [&_form_button]:border-none",
    "[&_form_button]:[border-width:0] [&_form_button]:rounded-full [&>a]:flex [&>a]:items-center [&>a]:text-rf-green",
    "[&>a]:text-[11px] [&>a]:font-bold [&>a]:mt-2.5 [&>a]:gap-1 max-[1024px]:gap-2.5 max-[1024px]:[&_form]:flex-1",
    "max-[1024px]:[&_form]:m-0 max-[1024px]:[&>a]:m-0 max-[768px]:mb-4.5 max-[768px]:p-3 max-[768px]:gap-3",
    "max-[768px]:[&_h2]:text-[10px] max-[768px]:[&_h2]:px-3.25 max-[768px]:[&_h2]:py-2.25 max-[768px]:[&_form]:order-4",
    "max-[768px]:[&_form]:basis-full max-[768px]:[&>a]:ml-auto max-[768px]:[&>a]:text-[9px]",
    "max-[768px]:[&_input]:text-[11px] max-[768px]:[&_input]:h-9.25 max-[768px]:[&_form_button]:w-6.75",
    "max-[768px]:[&_form_button]:h-6.75 min-[1024px]:grid min-[1024px]:grid-cols-[max-content_minmax(0,_1fr)_max-content]",
    "min-[1024px]:gap-y-7 min-[1024px]:p-5.5 min-[1024px]:[&_form]:[grid-column:2] min-[1024px]:[&_form]:justify-self-end",
    "min-[1024px]:[&_form]:m-0 min-[1024px]:[&>a]:[grid-column:3] min-[1024px]:[&>a]:m-0",
  ].join(" "),
  blog_filters: [
    "rf-blog-filters flex gap-1.75 [&_button]:bg-[#f1f5f6] [&_button]:bg-none [&_button]:text-[#50626d]",
    "[&_button]:text-[11px] [&_button]:whitespace-nowrap [&_button]:px-2.5 [&_button]:py-1.75 [&_button]:border-current",
    "[&_button]:border-none [&_button]:[border-width:0] [&_button]:rounded-[20px] max-[1024px]:overflow-x-auto",
    "max-[1024px]:max-w-full max-[768px]:order-3 max-[768px]:basis-full max-[768px]:pb-1.25 max-[768px]:gap-1.5",
    "max-[768px]:[&_button]:text-[10px] max-[768px]:[&_button]:px-2.25 max-[768px]:[&_button]:py-1.75",
    "min-[1024px]:[grid-column:2/4] min-[1024px]:[&_button]:text-[12px] [&_button.active]:bg-rf-green",
    "[&_button.active]:bg-none [&_button.active]:text-white",
  ].join(" "),
  blog_body: [
    "rf-blog-body grid grid-cols-[40%_minmax(0,_1fr)] gap-6 max-[1024px]:grid-cols-[40%_minmax(0,_1fr)]",
    "max-[1024px]:gap-3.75 max-[768px]:grid-cols-[1fr] max-[768px]:gap-3.75",
  ].join(" "),
  blog_lead: [
    "rf-blog-lead shadow-[0_3px_13px_#16323d15] p-4 rounded-[10px] [&_h3]:text-[18px] [&_h3]:leading-[1.5]",
    "[&_h3]:font-medium [&_h3]:mt-3.75 [&_h3]:mb-3 [&_h3]:mx-0 [&_p]:text-[15px] [&_p]:italic [&_p]:leading-[1.55]",
    "[&_p]:mt-0 [&_p]:mb-5 [&_p]:mx-0 max-[1024px]:[&_h3]:text-[15px] max-[1024px]:[&_p]:text-[13px] max-[768px]:p-3",
    "max-[768px]:[&_h3]:text-[16px] max-[768px]:[&_p]:text-[13px]",
  ].join(" "),
  blog_cover: [
    motion.media,
    "rf-blog-cover block relative w-full [aspect-ratio:1.7] rounded-[5px] overflow-hidden [&_img]:object-cover",
    "[&>span]:absolute [&>span]:bottom-3 [&>span]:left-3 [&>span]:bg-[#062b35dd] [&>span]:bg-none [&>span]:text-[#d4f7dc]",
    "[&>span]:text-[11px] [&>span]:font-extrabold [&>span]:px-2.5 [&>span]:py-1.75",
  ].join(" "),
  promotion_more: [
    "rf-promotion-more flex items-center justify-end text-rf-green text-[14px] mt-auto mb-3.75 mx-2.5 gap-1",
    "max-[768px]:text-[12px] max-[768px]:mt-0 max-[768px]:mb-1.25 max-[768px]:mx-0",
  ].join(" "),
  popular_posts: [
    "rf-popular-posts shadow-[0_3px_13px_#16323d15] p-4 rounded-[10px] [&_h3]:mt-0 [&_h3]:mb-1.25 [&_h3]:bg-[#f5f7f8]",
    "[&_h3]:bg-none [&_h3]:border-l-5 [&_h3]:[border-left-style:solid] [&_h3]:border-l-rf-green [&_h3]:text-[15px]",
    "[&_h3]:px-3.5 [&_h3]:py-3.25 [&_h3]:mx-0 [&_ol]:list-none [&_ol]:p-0 [&_ol]:m-0 [&_li]:flex [&_li]:items-start",
    "[&_li]:min-h-13.75 [&_li]:border-b [&_li]:[border-bottom-style:dashed] [&_li]:border-b-[#e1e8e9] [&_li]:px-0",
    "[&_li]:py-3.75 [&_li]:gap-3 [&_li>span]:shrink-0 [&_li>span]:grid [&_li>span]:place-items-center",
    "[&_li>span]:bg-[#e9f5ee] [&_li>span]:bg-none [&_li>span]:text-rf-green [&_li>span]:font-bold [&_li>span]:text-[14px]",
    "[&_li>span]:w-5.75 [&_li>span]:h-6.25 [&_li>span]:rounded-[4px] [&_li>a]:text-[14px] [&_li>a]:text-[#3c515c]",
    "[&_li>a]:leading-[1.5] max-[1024px]:[&_li>a]:text-[12px] max-[768px]:p-3 max-[768px]:[&_h3]:text-[12px]",
    "max-[768px]:[&_h3]:p-2.75 max-[768px]:[&_li]:min-h-12.75 max-[768px]:[&_li]:px-0 max-[768px]:[&_li]:py-3",
    "max-[768px]:[&_li]:gap-2.25 max-[768px]:[&_li>a]:text-[12px] [&_li:last-child]:border-current",
    "[&_li:last-child]:border-none [&_li:last-child]:[border-width:0] [&_li>a:hover]:text-rf-green",
  ].join(" "),
  journal_list: [
    "rf-journal-list mt-6.25 grid gap-4.5 [&>article]:grid [&>article]:grid-cols-[180px_1fr] [&>article]:bg-white",
    "[&>article]:bg-none [&>article]:p-3.75 [&>article]:gap-5 [&_h2]:text-[19px] [&_h2]:my-2 [&_small]:text-rf-muted",
    "[&_small]:text-[12px] [&_p]:text-rf-muted [&_p]:text-[12px] max-[768px]:[&>article]:grid-cols-[90px_1fr]",
    "max-[768px]:[&>article]:p-2.5 max-[768px]:[&>article]:gap-3 max-[768px]:[&_h2]:text-[15px]",
    "max-[768px]:[&_p]:[display:-webkit-box] max-[768px]:[&_p]:[-webkit-box-orient:vertical]",
    "max-[768px]:[&_p]:[-webkit-line-clamp:3] max-[768px]:[&_p]:overflow-hidden [&_.rf-text-link]:text-[12px]",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

const filters = [
  "Tất cả",
  "Hướng dẫn",
  "Tư vấn – So sánh",
  "Tin công nghệ",
  "Kinh nghiệm hay",
];
// Bộ lọc demo dựa vào chủ đề biên tập; không gửi từ khóa hoặc category tới API.
const matchesTopic: Record<string, (article: Article) => boolean> = {
  "Hướng dẫn": (article) => article.tag.includes("HƯỚNG"),
  "Tư vấn – So sánh": (article) => /DDR|linh kiện|nguồn/i.test(article.title),
  "Tin công nghệ": (article) => /SSD|DDR|thông số/i.test(article.title),
  "Kinh nghiệm hay": (article) => /góc|lưu|bảo/i.test(article.title),
};
export function ReferenceJournal({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const { articles } = useCatalog();

  const [filter, setFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("vi");
  const visible = articles.filter(
    (article) =>
      article.title.toLocaleLowerCase("vi").includes(query) &&
      (filter === "Tất cả" || matchesTopic[filter](article)),
  );
  const lead = visible[0];
  return (
    <section
      className={
        `rf-reference-blog ${standalone ? "rf-journal-page" : ""}` +
        " " +
        tw.reference_blog_journal_page
      }
      aria-label="Blog tin tức"
    >
      <div className={tw.blog_toolbar}>
        {standalone ? <h1>TẤT CẢ BÀI VIẾT</h1> : <h2>BLOG TIN TỨC</h2>}
        <div className={tw.blog_filters}>
          {filters.map((label) => (
            <button
              key={label}
              className={filter === label ? "active" : ""}
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <input
            aria-label="Tìm bài viết"
            placeholder="Tìm kiếm bài viết…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button aria-label="Lọc bài viết">
            <Search size={14} />
          </button>
        </form>
        {!standalone && (
          <Link href="/articles">
            XEM TẤT CẢ <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {lead ? (
        <div key={filter} className={tw.blog_body + " " + motion.enter}>
          <article className={tw.blog_lead}>
            <Link href={`/articles/${lead.id}`} className={tw.blog_cover}>
              <Image
                src="/images/banners/banner-slider1.webp"
                alt="Cấu hình PC Gaming"
                fill
                sizes="420px"
              />
              <span>RIGFORGE JOURNAL</span>
            </Link>
            <h3>
              <Link href={`/articles/${lead.id}`}>
                {lead.title.toLocaleUpperCase("vi")}
              </Link>
            </h3>
            <p>{lead.content.slice(0, 190)}…</p>
            <Link className={tw.promotion_more} href={`/articles/${lead.id}`}>
              Xem thêm <ArrowRight size={12} />
            </Link>
          </article>
          <div className={tw.popular_posts}>
            <h3>BÀI VIẾT ĐƯỢC QUAN TÂM</h3>
            <ol>
              {visible.map((article, index) => (
                <li key={article.id}>
                  <span>{index + 1}</span>
                  <Link href={`/articles/${article.id}`}>{article.title}</Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="rf-blog-empty text-center text-[#657982] text-[14px] px-5 py-17.5">
          Không tìm thấy bài viết phù hợp. Thử từ khóa hoặc nhóm khác.
        </div>
      )}
      {standalone && visible.length > 0 && (
        <div className={tw.journal_list}>
          {visible.map((article) => (
            <article key={article.id}>
              <Link
                href={`/articles/${article.id}`}
                className="rf-journal-thumb relative min-h-30 [&_img]:object-cover"
              >
                <Image
                  src="/images/banners/banner-slider1.webp"
                  alt="PC Gaming minh họa"
                  fill
                  sizes="180px"
                />
              </Link>
              <div>
                <small>{article.tag} · NỘI DUNG MẪU</small>
                <h2>
                  <Link href={`/articles/${article.id}`}>{article.title}</Link>
                </h2>
                <p>{article.content}</p>
                <Link className={tw.text_link} href={`/articles/${article.id}`}>
                  Xem thêm →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
