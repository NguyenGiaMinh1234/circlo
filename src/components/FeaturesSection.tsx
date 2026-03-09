import { motion } from "framer-motion";
import { Palette, Zap, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Thiết kế tinh tế",
    description: "Giao diện được chế tác tỉ mỉ, mang đến trải nghiệm thị giác vượt trội.",
  },
  {
    icon: Zap,
    title: "Hiệu suất cao",
    description: "Tối ưu hóa tốc độ tải trang và phản hồi nhanh chóng cho người dùng.",
  },
  {
    icon: Shield,
    title: "Bảo mật vững chắc",
    description: "Hệ thống bảo mật đa lớp, bảo vệ dữ liệu an toàn tuyệt đối.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm mượt mà",
    description: "Chuyển động và tương tác tự nhiên, tạo cảm giác hài lòng khi sử dụng.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Giải pháp toàn diện cho dự án web của bạn
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-8 rounded-2xl bg-card hover:bg-primary hover:text-primary-foreground transition-colors duration-300 border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/15 group-hover:bg-primary-foreground/15 flex items-center justify-center mb-5 transition-colors">
                <feature.icon className="w-6 h-6 text-accent group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground group-hover:text-primary-foreground/70 transition-colors leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
