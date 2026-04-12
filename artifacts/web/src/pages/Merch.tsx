import { motion } from "framer-motion";
import { Link } from "wouter";
import tshirtImg from "@assets/t-shirt.png_1776018973005.png";
import hoodieImg from "@assets/hoodie.png_1776018973003.jpg";
import bomberImg from "@assets/bomber.png_1776018973002.jpg";
import capImg from "@assets/cap.png_1776018973002.jpg";
import logoBlack from "@assets/photo_2026-03-13_15-33-34_1776018973004.jpg";
import merchAllImg from "@assets/photo_2026-03-19_11-20-07_1776018973005.jpg";
import { GlitchButton } from "@/components/GlitchButton";

const PRODUCTS = [
  { id: 1, name: "Футболка \"Gathering Of The Fallen\"", price: "799 грн", image: tshirtImg, status: "В НАЯВНОСТІ" },
  { id: 2, name: "Худі \"Gathering Of The Fallen\"", price: "1499 грн", image: hoodieImg, status: "В НАЯВНОСТІ" },
  { id: 3, name: "Бомбер \"GF\"", price: "2499 грн", image: bomberImg, status: "ОБМЕЖЕНИЙ ТИРАЖ" },
  { id: 4, name: "Кепка \"Gathering Of The Fallen\"", price: "599 грн", image: capImg, status: "В НАЯВНОСТІ" },
  { id: 5, name: "Логотип (принт/постер)", price: "349 грн", image: logoBlack, status: "В НАЯВНОСТІ" },
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

      <div className="rusted-border overflow-hidden mb-12 group">
        <img 
          src={merchAllImg} 
          alt="Колекція мерчу Gathering Of The Fallen" 
          loading="lazy"
          className="w-full h-auto object-cover group-hover:brightness-110 transition-all duration-500"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {PRODUCTS.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ scale: 1.02 }}
            className="rusted-border bg-black/60 group flex flex-col h-full backdrop-blur-sm"
          >
            <div className="aspect-square w-full overflow-hidden border-b border-border relative bg-[#111] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
              <img 
                src={product.image} 
                alt={product.name} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-wider font-mono">{product.name}</h3>
                  <div className="text-primary font-mono mt-1 text-xl">{product.price}</div>
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
