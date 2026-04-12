import tshirtImg from "@/assets/merch-tshirt.png";
import hoodieImg from "@/assets/merch-hoodie.png";
import posterImg from "@/assets/merch-poster.png";
import { GlitchButton } from "./GlitchButton";

const PRODUCTS = [
  {
    id: "ts-1",
    name: "SIGNAL DECAY T-SHIRT",
    price: "$25.00",
    image: tshirtImg,
    status: "IN STOCK"
  },
  {
    id: "hd-1",
    name: "BUNKER ISSUE HOODIE",
    price: "$45.00",
    image: hoodieImg,
    status: "LOW SUPPLY"
  },
  {
    id: "ps-1",
    name: "LAST BROADCAST POSTER",
    price: "$15.00",
    image: posterImg,
    status: "IN STOCK"
  }
];

export function MerchSection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRODUCTS.map(product => (
          <div key={product.id} className="rusted-border bg-[#0a0a0a] group">
            <div className="aspect-square w-full overflow-hidden border-b border-border relative">
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover filter grayscale sepia-[0.3] group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-wider">{product.name}</h3>
                  <div className="text-primary font-mono">{product.price}</div>
                </div>
                <div className="text-xs font-mono px-2 py-1 bg-secondary/20 text-secondary border border-secondary/50">
                  {product.status}
                </div>
              </div>
              <GlitchButton className="w-full">INITIATE REQUISITION</GlitchButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
