import Header from "@/shared/components/Header";
import Design3D from "@/features/design3d/components/Design3D";
import { useSearchParams } from "react-router-dom";

const Design3DPage = () => {
  const [params] = useSearchParams();
  const productId = params.get("product") ?? undefined;

  return (
    <div className="page-brand-bg min-h-screen">
      <Header compact={true} />
      <div className="pt-12">
        <Design3D initialProductId={productId} />
      </div>
    </div>
  );
};

export default Design3DPage;