import { About } from "@/components/About/About";
import { Catalog } from "@/components/Catalog/Catalog";
import { Delivery } from "@/components/Delivery/Delivery";
import { Divider } from "@/components/Divider/Divider";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";
import { Marquee } from "@/components/Marquee/Marquee";
import { FlightLayer } from "@/components/Motion/FlightProduct";
import { ScrollScenes } from "@/components/Motion/ScrollScenes";
import { SmoothScroll } from "@/components/Motion/SmoothScroll";
import { Order } from "@/components/Order/Order";
import { OrderProvider } from "@/components/Order/OrderContext";
import { LinesDefs } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark/Wordmark";

export default function Home() {
  return (
    <>
      <OrderProvider>
        <LinesDefs />
        <Header />
        <main className="page">
          <Hero />
          <Wordmark />
          <Catalog />
          <Marquee />
          <About />
          <Delivery />
          <Order />
          <Divider />
          <FlightLayer />
        </main>
        <Footer />
      </OrderProvider>
      <SmoothScroll />
      <ScrollScenes />
    </>
  );
}
