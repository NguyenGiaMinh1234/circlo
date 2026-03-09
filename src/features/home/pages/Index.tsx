import Header from "@/shared/components/Header";
import VideoHero from "@/features/home/components/VideoHero";
import Products from "@/features/products/components/Products";
import PromoImageRail from "@/features/home/components/PromoImageRail";
import Footer from "@/shared/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <VideoHero />
      <div className="content-auto">
        <Products />
      </div>
      <div className="content-auto">
        <PromoImageRail />
      </div>
      <div className="content-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
