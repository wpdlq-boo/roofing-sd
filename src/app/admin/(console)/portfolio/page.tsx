import { PortfolioManager } from "./portfolio-manager";

export default async function ManagePortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const { new: openNew } = await searchParams;
  return <PortfolioManager openNew={openNew === "1"} />;
}
