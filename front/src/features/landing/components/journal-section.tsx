"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CategoryIcon, SectionTitle } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  article_card: [
    "rf-article-card bg-white bg-none [transition:transform_0.2s] border-rf-border border-solid border rounded-[10px]",
    "overflow-hidden [&_small]:text-[8px] [&_small]:font-bold [&_small]:text-rf-green [&_small]:tracking-[1px]",
    "[&_small>span]:text-[#8b958d] [&_small>span]:ml-1.75 [&_small>span]:tracking-[0] [&_small>span]:font-normal",
    "[&_h3]:text-[17px] [&_h3]:leading-[1.5] [&_h3]:mt-2.5 [&_h3]:mb-5 [&_h3]:mx-0 max-[1024px]:[&_h3]:text-[15px]",
    "max-[768px]:grid max-[768px]:grid-cols-[115px_1fr] max-[768px]:[&_h3]:text-[14px] max-[768px]:[&_h3]:mt-2",
    "max-[768px]:[&_h3]:mb-3 max-[768px]:[&_h3]:mx-0 max-[768px]:[&_small]:text-[7px]",
    "max-[768px]:[&_small]:tracking-[0.6px] max-[768px]:[&_small>span]:hidden hover:[transform:translateY(-3px)]",
    "[&>div:last-child]:p-5.5 [&_.rf-text-link]:text-[10px] max-[1024px]:[&>div:last-child]:p-4",
  ].join(" "),
  article_visual_article_visual_1_article_visual_2: [
    "flex relative items-center justify-center min-h-40 bg-[radial-gradient(ellipse_at_55%_80%,_#8bb298,_#dfeae1_75%)]",
    "bg-transparent text-[#466756] [&>span]:absolute [&>span]:bottom-4 [&>span]:left-5 [&>span]:text-[8px]",
    "[&>span]:tracking-[2px] [&>span]:opacity-[0.7] max-[768px]:min-h-38.75 max-[768px]:[&_svg]:w-13.75",
    "max-[768px]:[&>span]:hidden [&.rf-article-visual-1]:bg-[radial-gradient(ellipse_at_55%_80%,_#aaa5bb,_#e6e5ed_75%)]",
    "[&.rf-article-visual-1]:text-[#696179]",
    "[&.rf-article-visual-2]:bg-[radial-gradient(ellipse_at_55%_80%,_#c0a587,_#ede7de_75%)]",
    "[&.rf-article-visual-2]:text-[#897355]",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

export function JournalSection() {
  const { articles } = useCatalog();

  return (
    <section className="rf-section mt-11 max-[768px]:mt-8">
      <SectionTitle
        title="Có kiến thức. Build tự tin."
        eyebrow="GÓC CÔNG NGHỆ"
        href="/articles"
      />
      <div className="rf-article-grid grid grid-cols-[repeat(3,_1fr)] gap-5 max-[768px]:grid-cols-[1fr] max-[768px]:gap-3.5">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className={tw.article_card}
          >
            <div
              className={
                `rf-article-visual rf-article-visual-${index}` +
                " " +
                tw.article_visual_article_visual_1_article_visual_2
              }
              aria-hidden="true"
            >
              <CategoryIcon id={["pc", "ram", "gear"][index]} size={72} />
              <span>RIGFORGE JOURNAL</span>
            </div>
            <div>
              <small>
                {article.tag} <span>· 5 phút đọc</span>
              </small>
              <h3>{article.title}</h3>
              <span className={tw.text_link}>
                Đọc bài viết <ArrowUpRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
