"use client";

import { Tag, Gift, Star, Monitor, CreditCard } from "lucide-react";

import Button from "@/src/components/ui/Button/Button";

const promotions = [
  {
    icon: <Tag size={15} />,
    label: "Mở thẻ VPBank nhận voucher 300K",
  },
  {
    icon: <Gift size={15} />,
    label: "Trả góp PC/Laptop trợ giá 500K",
  },
  {
    icon: <Star size={15} />,
    label: "Lên đời màn hình 2K voucher 1 triệu",
  },
  {
    icon: <Monitor size={15} />,
    label: "PC Gaming quốc dân giá chỉ từ 15 triệu",
  },
  {
    icon: <CreditCard size={15} />,
    label: "Laptop ưu đãi khủng - Trả trước 0 đồng",
  },
];

export default function PromoMarquee() {
  return (
    <div className="rf-marquee">
      <div className="rf-marquee-viewport">
        <div className="rf-marquee-track">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="rf-marquee-group"
              aria-hidden={group === 1}
            >
              {promotions.map((item, index) => (
                <div className="rf-marquee-item" key={index}>
                  <Button
                    variant="outline"
                    size="xs"
                    rounded="full"
                    leftIcon={item.icon}
                    tabIndex={group === 1 ? -1 : 0}
                    className="rf-marquee-button"
                  >
                    {item.label}
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
