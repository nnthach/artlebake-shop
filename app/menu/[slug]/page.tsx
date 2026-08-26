import ProductDetailClient from "@/components/sections/product-detail/ProductDetailClient";

interface ProductDetailPageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return <ProductDetailClient params={params} />;
}
