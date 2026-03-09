import type { ReactNode } from "react";
import { ShoppingBag, Shirt, Wallet, Backpack } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  modelPath: string;
  icon: ReactNode;
  /** Map từ tên mesh trong GLTF → nhãn hiển thị tiếng Việt */
  partLabels?: Record<string, string>;
}

export const products: Product[] = [
  {
    id: "wallet",
    name: "Ví",
    modelPath: "/models/vi.glb",
    icon: <Wallet className="w-4 h-4" />,
    partLabels: {
      "pCube1_lambert3_0": "Mặt trước",
      "pCube2_lambert3_0": "Mặt sau",
      "pCube3_lambert3_0": "Ngăn thẻ trái",
      "pCube4_lambert3_0": "Ngăn thẻ phải",
      "pCube5_lambert3_0": "Gáy ví",
      "pCylinder1_lambert3_0": "Nút bấm",
    },
  },
  {
    id: "tshirt",
    name: "Áo thun",
    modelPath: "/models/ao-thun.glb",
    icon: <Shirt className="w-4 h-4" />,
  },
  {
    id: "tote",
    name: "Túi tote",
    modelPath: "/models/tui-tote.glb",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    id: "backpack",
    name: "Balo",
    modelPath: "/models/balo.glb",
    icon: <Backpack className="w-4 h-4" />,
  },
];
