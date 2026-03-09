import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import toteImageOne from "@/assets/tote1.jpg";
import toteImageTwo from "@/assets/tote2.jpg";
import walletImageOne from "@/assets/wallet1.jpg";
import walletImageTwo from "@/assets/wallet2.jpg";
import accessoryImageOne from "@/assets/phukien1.jpg";
import accessoryImageTwo from "@/assets/phukien2.jpg";
import accessoryImageThree from "@/assets/phukien3.jpg";

const categories = [
  { id: "bags", label: "Túi & Balo" },
  { id: "accessories", label: "Phụ Kiện" },
  { id: "decor", label: "Trang Trí" },
];

const products = [
  {
    title: "Túi Tote",
    image: toteImageOne,
    images: [toteImageOne, toteImageTwo],
    description: "Túi tote thiết kế độc đáo, phù hợp cho mọi hoạt động hàng ngày",
    category: "bags",
  },
  {
    title: "Ví",
    image: walletImageOne,
    images: [walletImageOne, walletImageTwo],
    description: "Ví denim thủ công với phom dáng gọn, điểm nhấn thêu hoa nổi bật, phù hợp cho phong cách trẻ trung và cá tính hằng ngày.",
    category: "accessories",
  },
  {
    title: "Đồ Trang Trí Nhỏ",
    image: accessoryImageOne,
    images: [accessoryImageOne, accessoryImageTwo, accessoryImageThree],
    description: "Đồ trang trí nhỏ từ denim tái chế với chi tiết thêu thủ công nổi bật, phù hợp để làm điểm nhấn cá tính cho góc bàn, kệ đồ hoặc không gian sống.",
    category: "decor",
  },
];

const Products = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const handleCategoryChange = (event: CustomEvent) => {
      setSelectedCategories(event.detail);
    };

    window.addEventListener(
      "categoryFilterChange",
      handleCategoryChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "categoryFilterChange",
        handleCategoryChange as EventListener
      );
    };
  }, []);

  const filteredProducts =
    selectedCategories.length === 0
      ? products
      : products.filter((product) =>
          selectedCategories.includes(product.category)
        );

  return (
    <section id="products" className="brand-surface-gradient">
      <div className="px-0 pt-32 pb-0">
        <div className="text-center mb-24 px-6">
          <div className="mb-6">
            <h2 className="gradient-text-brand text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.2em] uppercase">
              Bộ sưu tập
            </h2>
          </div>

          <p className="text-base md:text-lg text-primary/85 max-w-3xl mx-auto font-light tracking-wider">
            Khám phá bộ sưu tập phụ kiện đa dạng, được thiết kế riêng theo phong cách của bạn
          </p>
          
          {selectedCategories.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Đang hiển thị {filteredProducts.length} sản phẩm
            </p>
          )}
        </div>

        <div className="space-y-0">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={index}
              title={product.title}
              image={product.image}
              description={product.description}
              images={product.images}
              prioritizeImage={index === 0}
              isReversed={index % 2 !== 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
