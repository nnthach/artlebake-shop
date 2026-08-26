import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MenuHeroSection from "@/components/sections/menu/MenuHeroSection";
import MenuSection from "@/components/sections/menu/MenuSection";

export default function MenuPage() {
  return (
    <div className="bg-sand">
      <Header />
      <MenuHeroSection />
      <MenuSection />
      <Footer />
    </div>
  );
}
