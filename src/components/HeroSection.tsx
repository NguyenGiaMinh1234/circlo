import { motion } from "framer-motion";
import heroImage from "@/assets/hero-abstract.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center py-20">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/15 text-accent-foreground font-display text-sm font-medium tracking-wide mb-6">
            Thiết kế hiện đại
          </span>
          <h1 className="text-5xl md:text-7xl font-bold font-display leading-[1.05] tracking-tight mb-6">
            Sáng tạo
            <br />
            <span className="text-accent">không giới hạn</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
            Khám phá sức mạnh của thiết kế web hiện đại. Xây dựng những trải nghiệm số ấn tượng và đáng nhớ.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-display font-medium hover:opacity-90 transition-opacity">
              Bắt đầu ngay
            </button>
            <button className="px-8 py-3.5 rounded-lg border border-border text-foreground font-display font-medium hover:bg-secondary transition-colors">
              Tìm hiểu thêm
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img src={heroImage} alt="Abstract design" className="w-full aspect-square object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-xl bg-accent/20 -z-10" />
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-secondary -z-10" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
