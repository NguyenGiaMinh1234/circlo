import backgroundImage from "@/assets/background.png";

const VideoHero = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 z-10 brand-surface-gradient-strong" />

      {/* Video Background */}
      {/* <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      >
        <source
          src="https://player.vimeo.com/external/824804225.sd.mp4?s=d5d2c0d3d1f3e0b5a4c9e8f7d6e5c4b3a2b1c0d9&profile_id=165"
          type="video/mp4"
        />
      </video> */}

      {/* Content Overlay */}
      <div className="relative w-full h-screen">
        <img
          src={backgroundImage}
          alt="Nen thuong hieu Criclo"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" />

        <div className="relative z-20 flex items-center justify-center h-full">
          <div className="text-center space-y-8 px-4">
            <h1 className="hero-title-flow text-5xl md:text-7xl lg:text-[9rem] leading-[0.95]">
              Cũ nhưng Cool
            </h1>
            <p className="hero-subtitle-luxe text-2xl md:text-4xl font-normal normal-case">
              Thời trang không có tuổi!
            </p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-px h-16 bg-gradient-to-b from-primary/60 to-transparent" />
      </div>
    </section>
  );
};

export default VideoHero;
