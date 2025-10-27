import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHomePageData } from "../../features/product/homeSlice";
import HeroSection from "./HeroSection";
import Collections from "./Collections";
import ProductSection from "./ProductSection";
import CraftsmanshipShowcase from "./CraftsmanshipShowcase";
import SEO from "../../components/SEO";
import { generateWebsiteSchema } from "../../utils/schemaUtils";
import styles from "./css/Home.module.css";

const Home = () => {
  const dispatch = useDispatch();
  const { error, status } = useSelector((state) => state.home);

  // Generate schema for the home page
  const schema = generateWebsiteSchema();

  // Centralized data fetching for all home page components
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchHomePageData());
    }
  }, [dispatch, status]);

  // Log any errors but continue rendering with shimmer effects
  if (error) {
    console.error("Error loading homepage data:", error);
  }

  // Each component will handle its own shimmer loading state
  return (
    <div>
      <SEO
        title="Origins By The Sea | Handcrafted Sustainable Fashion"
        description="Discover elegantly handcrafted swimwear, dresses, and accessories inspired by the sea. Sustainable, ethical fashion designed with passion and purpose."
        canonicalUrl="https://originsbythesea.com"
        schema={schema}
      />
      <HeroSection />
      {/* <LuxuryDescription /> */}
      <Collections />
      {/* <ImageCollage /> */}
      {/* <JewelryShowcase />
      <BrandIntroSection /> */}
      <ProductSection />
      <CraftsmanshipShowcase />
    </div>
  );
};

export default Home;
