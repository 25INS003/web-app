import { ProductDetail } from "@/features/catalog/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductDetail productId={productId} />;
}
