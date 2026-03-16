import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProductCardProps {
  title: string;
  image: string;
  description: string;
  images?: string[];
  isReversed?: boolean;
  prioritizeImage?: boolean;
}

const ProductCard = ({ title, image, description, images, isReversed = false, prioritizeImage = false }: ProductCardProps) => {
  const [open, setOpen] = useState(false);
  const galleryImages = images && images.length > 0 ? images : [image];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={`group relative h-screen w-full overflow-hidden cursor-pointer ${isReversed ? 'flex-row-reverse' : ''}`}>
          <div className="absolute inset-0">
            <img
              src={image}
              alt={title}
              loading={prioritizeImage ? "eager" : "lazy"}
              fetchPriority={prioritizeImage ? "high" : "auto"}
              decoding="async"
              sizes="100vw"
              className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,27,45,0.4),rgba(0,78,154,0.28),rgba(66,140,212,0.24),rgba(255,156,218,0.18),rgba(234,68,146,0.24))] group-hover:bg-[linear-gradient(90deg,rgba(4,27,45,0.32),rgba(0,78,154,0.22),rgba(66,140,212,0.18),rgba(255,156,218,0.14),rgba(234,68,146,0.18))] transition-all duration-700" />
          </div>
          
          <div className={`relative z-10 h-full flex items-center ${isReversed ? 'justify-start pl-12 md:pl-24' : 'justify-end pr-12 md:pr-24'}`}>
            <div className={`max-w-xl space-y-4 ${isReversed ? 'text-left' : 'text-right'}`}>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[0.2em] uppercase text-white">
                {title}
              </h3>
              <p className="text-base md:text-lg text-white/80 font-light tracking-wider max-w-md">
                {description}
              </p>
              <div className={`flex gap-4 pt-4 ${isReversed ? 'justify-start' : 'justify-end'}`}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-white/45 border-primary/20 text-primary hover:bg-white hover:text-primary transition-all duration-300 backdrop-blur-sm font-light tracking-wider uppercase rounded-xl"
                >
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(66,140,212,0.06),rgba(255,156,218,0.08),rgba(234,68,146,0.06))] border-primary/15 rounded-3xl sm:max-h-[88vh]">
        <DialogHeader>
          <DialogTitle className="text-3xl md:text-4xl font-bold tracking-[0.2em] uppercase text-primary">{title}</DialogTitle>
          <DialogDescription className="font-light text-primary/85 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="max-h-[56vh] overflow-y-auto pr-2 sm:max-h-[60vh]">
            <div className="grid gap-4 md:grid-cols-2">
            {galleryImages.map((galleryImage, index) => (
              <img
                key={`${title}-${index}`}
                src={galleryImage}
                alt={`${title} ${index + 1}`}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-72 w-full rounded-2xl object-cover md:h-80"
              />
            ))}
            </div>
          </div>
          
          <Button 
            variant="default" 
            size="lg"
            className="w-full bg-[linear-gradient(90deg,rgba(4,27,45,0.96),rgba(0,78,154,0.94),rgba(66,140,212,0.88),rgba(234,68,146,0.9))] text-white hover:opacity-90 font-light tracking-[0.2em] uppercase rounded-xl"
            onClick={() => {
              setOpen(false);
              window.location.href = ROUTES.BOOKING;
            }}
          >
            Đặt thiết kế
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ProductCard);
