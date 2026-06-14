import { CategoryView } from "@/features/catalog/CategoryView";

export const metadata = { title: "Category · Nedyway" };

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CategoryView categoryId={category} />;
}
