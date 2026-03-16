import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/shared/components/Header";

import VideoHero from "@/features/home/components/VideoHero";
import Products from "@/features/products/components/Products";
import PromoImageRail from "@/features/home/components/PromoImageRail";
import Footer from "@/shared/components/Footer";
import { ROUTES } from "@/lib/routes";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const shouldScrollToProducts =
      location.pathname === ROUTES.PRODUCTS || location.hash === "#products";

    if (!shouldScrollToProducts) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById("products");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      if (location.pathname === ROUTES.PRODUCTS) {
        navigate(ROUTES.HOME, { replace: true });
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash, navigate]);

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
