import backgroundImage from "@/assets/backgrounds/nenweb-01.png";

const VideoHero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white">

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
      <div className="relative h-screen w-full">
        <img
          src={backgroundImage}
          alt="Nen thuong hieu Criclo"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(4,27,45,0.84)_0%,rgba(4,27,45,0.62)_26%,rgba(0,78,154,0.28)_48%,rgba(255,156,218,0.14)_72%,rgba(4,27,45,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_22%,rgba(4,27,45,0.14)_60%,rgba(4,27,45,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,27,45,0.28)_0%,rgba(4,27,45,0.08)_34%,rgba(4,27,45,0.56)_100%)]" />

        <div className="relative z-20 flex h-full items-center justify-center">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-6 md:px-10 lg:px-16">
            <div className="max-w-4xl translate-y-[55pt] text-center">
              <h1 className="hero-title-flow text-4xl leading-[0.96] sm:text-5xl md:text-6xl lg:text-[7.5rem] xl:text-[8rem]">
                CŨ NHƯNG COOL
              </h1>
              <p className="hero-subtitle-luxe mx-auto mt-6 max-w-2xl text-xl font-normal normal-case sm:text-2xl md:text-3xl lg:text-[2.35rem]">
                Thời trang không có tuổi!
              </p>
            </div>
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
