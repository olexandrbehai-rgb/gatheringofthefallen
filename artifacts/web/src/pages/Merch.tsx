import { motion } from "framer-motion";
import { Link } from "wouter";
import tshirtImg from "@/assets/merch-tshirt.png";
import hoodieImg from "@/assets/merch-hoodie.png";
import posterImg from "@/assets/merch-poster.png";
import { GlitchButton } from "@/components/GlitchButton";

const PRODUCTS = [
  { id: 1, name: "Футболка \"Signal Decay\"", price: "799 грн", image: tshirtImg, status: "IN STOCK" },
  { id: 2, name: "Худі \"Bunker Issue\"", price: "1499 грн", image: hoodieImg, status: "LOW SUPPLY" },
  { id: 3, name: "Плакат \"Last Broadcast\"", price: "349 грн", image: posterImg, status: "IN STOCK" },
  { id: 4, name: "Патч \"Gathering Emblem\"", price: "199 грн", image: tshirtImg, status: "IN STOCK" }, // using tshirt as placeholder
  { id: 5, name: "Кепка \"Wasteland\"", price: "599 грн", image: hoodieImg, status: "PRE-ORDER" }, // using hoodie as placeholder
  { id: 6, name: "Значок \"Fallen\"", price: "99 грн", image: posterImg, status: "IN STOCK" } // using poster as placeholder
];

export default function Merch() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <h1 className="font-creepster text-5xl md:text-7xl text-primary text-center md:text-left">МЕРЧ</h1>
        <Link href="/forge">
          <GlitchButton className="border-secondary text-secondary hover:bg-secondary/20 flex items-center gap-2">
            <span>&gt; ВІДВІДАТИ КУЗНЮ ПОВАЛЕНИХ</span>
          </GlitchButton>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {PRODUCTS.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ scale: 1.02 }}
            className="rusted-border bg-[#0a0a0a] group flex flex-col h-full"
          >
            <div className="aspect-square w-full overflow-hidden border-b border-border relative bg-[#111] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-[80%] h-[80%] object-contain filter grayscale sepia-[0.3] group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-wider font-mono">{product.name}</h3>
                  <div className="text-primary font-mono mt-1">{product.price}</div>
                </div>
              </div>
              <div className="mt-auto pt-6 flex items-center justify-between">
                <span className="text-xs font-mono px-2 py-1 bg-secondary/20 text-secondary border border-secondary/50">
                  {product.status}
                </span>
                <GlitchButton className="px-4 py-1 text-sm">Купити</GlitchButton>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}