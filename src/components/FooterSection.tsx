const FooterSection = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display font-bold text-xl tracking-tight">Studio.</span>
        <p className="text-sm text-muted-foreground">
          © 2026 Studio. Mọi quyền được bảo lưu.
        </p>
        <div className="flex gap-6">
          {["Giới thiệu", "Dịch vụ", "Liên hệ"].map((link) => (
            <a key={link} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
