"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import Image from "next/image";
import { ReferenceJournal } from "@/src/features/landing/components/reference-journal";
import { ArrowRight, ChevronDown, LifeBuoy } from "lucide-react";

import {
  Breadcrumb,
  CategoryIcon,
  SectionTitle,
} from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  panel_prose: [
    "rf-panel rf-prose bg-rf-surface bg-none mb-5 w-full leading-[1.9] p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[19px] [&_h1]:text-[34px] [&_h1]:tracking-[-0.7px] [&_h1]:leading-[1.4]",
    "max-[768px]:p-4.5 [&_p]:text-[#5f7164] max-[768px]:[&_h1]:text-[27px] [&_.rf-eyebrow]:mb-2.5",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
  article_page_prose: [
    "rf-article-page rf-prose w-full leading-[1.9] mx-auto my-8.75 [&_h1]:text-[36px] [&_h1]:leading-[1.4]",
    "[&_h1]:tracking-[-1px] [&_p]:text-[#5f7164] max-[768px]:[&_h1]:text-[27px] [&_.rf-eyebrow]:mb-2.5",
    "[&_.rf-article-visual]:min-h-70 [&_.rf-article-visual]:my-7.5 [&_.rf-article-visual]:rounded-[10px]",
    "max-[768px]:[&_.rf-article-visual]:min-h-50",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  panel_related_articles: [
    "rf-panel rf-related-articles bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[17px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
    "[&_ol]:pl-6 [&_ol]:text-[14px] [&_li]:leading-[1.6] [&_li]:mx-0 [&_li]:my-4",
  ].join(" "),
  page_heading: [
    "rf-page-heading flex justify-between items-center mx-0 my-7.5 gap-5 [&_h1]:text-[32px] [&_h1]:tracking-[-1px]",
    "[&_h1]:leading-[1.2] [&_h1]:mt-2 [&_h1]:mb-2.5 [&_h1]:mx-0 [&_h1_small]:text-[20px] [&_h1_small]:text-rf-muted",
    "[&_p]:text-rf-muted [&_p]:text-[13px] [&_p]:mb-0 max-[768px]:flex-wrap max-[768px]:mx-0 max-[768px]:my-6",
    "max-[768px]:[&_h1]:text-[27px]",
  ].join(" "),
  account_stats: [
    "rf-account-stats grid grid-cols-[repeat(3,_1fr)] mx-0 my-7.5 gap-4.5 [&>a]:flex [&>a]:flex-col [&>a]:bg-white",
    "[&>a]:bg-none [&>a]:p-6 [&>a]:border-rf-border [&>a]:border-solid [&>a]:border [&>a]:rounded-[9px]",
    "[&_svg]:text-[#5f9270] [&_strong]:text-[32px] [&_strong]:mt-3 [&_span]:text-[11px] [&_span]:text-rf-muted",
    "max-[768px]:gap-2.25 max-[768px]:[&>a]:px-3 max-[768px]:[&>a]:py-3.75 max-[768px]:[&_strong]:text-[26px]",
    "max-[768px]:[&_span]:text-[9px]",
  ].join(" "),
  panel: [
    "rf-panel rf-faq bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border rounded-[var(--rf-radius)]",
    "[&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  category_tiles: [
    "rf-category-tiles grid grid-cols-[repeat(12,_1fr)] gap-2.5 [&>a]:flex [&>a]:flex-col [&>a]:items-center",
    "[&>a]:justify-center [&>a]:bg-white [&>a]:bg-none [&>a]:min-h-24 [&>a]:text-[10px] [&>a]:font-semibold",
    "[&>a]:[transition:border-color_0.2s,_transform_0.2s] [&>a]:border-rf-border [&>a]:border-solid [&>a]:border",
    "[&>a]:rounded-[9px] [&>a]:gap-3 [&>a_svg]:text-[#577567] max-[1200px]:grid-cols-[repeat(6,_1fr)]",
    "max-[1200px]:[&>a]:min-h-22 max-[768px]:grid-cols-[repeat(4,_1fr)] max-[768px]:gap-2 max-[768px]:[&>a]:min-h-20.5",
    "max-[768px]:[&>a]:text-[9px] max-[768px]:[&>a]:gap-2.25 max-[768px]:[&>a_svg]:w-6 max-[768px]:[&>a_svg]:h-6",
    "[&>a:hover]:[transform:translateY(-3px)] [&>a:hover]:border-[#a3c9b5]",
  ].join(" "),
};

/** Nội dung thuần giữ ở server; khi có CMS chỉ thay nguồn paragraphs. */
export function InformationPage({ slug }: { slug: string }) {
  const { informationPages } = useCatalog();
  const page = informationPages[slug];
  return (
    <>
      <Breadcrumb current={page.title} />
      <article className={tw.panel_prose}>
        <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
          RIGFORGE · THÔNG TIN MINH HỌA
        </span>
        <h1>{page.title}</h1>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <Link href="/support" className={tw.text_link}>
          Trung tâm hỗ trợ <ArrowRight size={16} />
        </Link>
      </article>
    </>
  );
}

export function ArticlesPage({ slug }: { slug?: string }) {
  const { articles } = useCatalog();

  const article = articles.find((item) => item.id === slug);
  if (article)
    return (
      <>
        <Breadcrumb
          current={article.title}
          parent={{ label: "Góc công nghệ", href: "/articles" }}
        />
        <div className="rf-news-article-layout grid grid-cols-[1.65fr_1fr] items-start gap-6.25 max-[768px]:grid-cols-[1fr] [&_.rf-article-page]:max-w-full [&_.rf-article-page]:m-0">
          <article className={tw.article_page_prose}>
            <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
              {article.tag} · NỘI DUNG MINH HỌA
            </span>
            <h1>{article.title}</h1>
            <div className="rf-news-article-cover relative h-82.5 my-5 [&_img]:object-cover max-[768px]:h-55">
              <Image
                src={article.image}
                alt="Cấu hình PC Gaming minh họa"
                fill
                sizes="(max-width: 767px) 100vw, 760px"
              />
            </div>
            <p>{article.content}</p>
            <Link href="/pc-builder" className={tw.btn}>
              Thử ráp cấu hình của bạn <ArrowRight size={16} />
            </Link>
          </article>
          <aside className={tw.panel_related_articles}>
            <h2>BÀI VIẾT ĐƯỢC QUAN TÂM</h2>
            <ol>
              {articles
                .filter((item) => item.id !== article.id)
                .map((item) => (
                  <li key={item.id}>
                    <Link href={`/articles/${item.id}`}>{item.title}</Link>
                  </li>
                ))}
            </ol>
          </aside>
        </div>
      </>
    );
  return (
    <>
      <Breadcrumb current="Góc công nghệ" />
      <ReferenceJournal standalone />
    </>
  );
}

export function SupportPage() {
  return (
    <>
      <Breadcrumb current="Trung tâm hỗ trợ" />
      <div className={tw.page_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            ĐỒNG HÀNH CÙNG BẠN
          </span>
          <h1>Bạn cần hỗ trợ điều gì?</h1>
          <p>Thông tin hướng dẫn cho bản trải nghiệm Rigforge.</p>
        </div>
      </div>
      <div className={tw.account_stats}>
        <Link href="/account/orders">
          <LifeBuoy />
          <strong>01</strong>
          <span>Tra cứu đơn hàng</span>
        </Link>
        <Link href="/account/warranties">
          <LifeBuoy />
          <strong>02</strong>
          <span>Yêu cầu bảo hành</span>
        </Link>
        <Link href="/account/support/new">
          <LifeBuoy />
          <strong>03</strong>
          <span>Tạo yêu cầu hỗ trợ</span>
        </Link>
      </div>
      <section className={tw.panel}>
        <h2>Câu hỏi thường gặp</h2>
        {[
          {
            question: "Trang này có bán hàng và thu tiền thật không?",
            answer:
              "Đây là môi trường development. Đơn COD được lưu trên server; chưa có thu tiền hay giao hàng thật.",
          },
          {
            question: "Tôi có thể lưu cấu hình PC ở đâu?",
            answer:
              "Trong PC Studio, chọn linh kiện rồi bấm Lưu cấu hình. Bản lưu nằm trong tài khoản và có thể mở lại sau đăng nhập.",
          },
          {
            question:
              "Kết quả kiểm tra tương thích có bảo đảm hoàn toàn không?",
            answer:
              "Chưa. Công cụ chỉ áp dụng một số quy tắc thông số; BIOS, đầu nguồn, khe cắm và khoảng hở thực tế cần kiểm tra thêm.",
          },
        ].map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <ChevronDown size={17} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </>
  );
}

export { ShowroomsPage } from "./showrooms-page";

export function BrandsPage() {
  const { categories, products } = useCatalog();

  return (
    <>
      <Breadcrumb current="Thương hiệu" />
      <SectionTitle title="Những thương hiệu bạn tin chọn" />
      <div className={tw.category_tiles}>
        {[
          ...new Set(products.map((product) => product.brand).filter(Boolean)),
        ].map((brand) => (
          <Link key={brand} href={`/products?brand=${brand}`}>
            {brand}
          </Link>
        ))}
      </div>
      <section className="rf-section mt-11 max-[768px]:mt-8">
        <SectionTitle title="Khám phá danh mục" />
        <div className={tw.category_tiles}>
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              <CategoryIcon id={category.id} />
              {category.short}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
