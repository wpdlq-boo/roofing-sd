import { FaqManager } from "./faq-manager";

export default async function ManageFaqsPage({ searchParams }: PageProps<"/admin/faqs">) {
  const { new: openNew } = await searchParams;
  return <FaqManager openNew={openNew === "1"} />;
}
