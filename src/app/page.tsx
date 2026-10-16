import { About } from "@/components/About/About";
import { Catalog } from "@/components/Catalog/Catalog";
import { Delivery } from "@/components/Delivery/Delivery";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";
import { Marquee } from "@/components/Marquee/Marquee";
import { Order } from "@/components/Order/Order";
import { OrderProvider } from "@/components/Order/OrderContext";
import { ThemePanel } from "@/components/ThemePanel/ThemePanel";
import { WavesDefs } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark/Wordmark";

export default function Home() {
  return (
    <>
      <OrderProvider>
        <WavesDefs />
        <Header />
        <main>
          <Hero />
          <Wordmark />
          <Catalog />
          <Marquee />
          <About />
          <Delivery />
          <Order />
        </main>
        <Footer />
      </OrderProvider>
      <ThemePanel />
    </>
  );
}
