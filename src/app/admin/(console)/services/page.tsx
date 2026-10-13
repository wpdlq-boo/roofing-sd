import { ServiceManager } from "./service-manager";

export default async function ManageServicesPage({ searchParams }: PageProps<"/admin/services">) {
  const { new: openNew } = await searchParams;
  return <ServiceManager openNew={openNew === "1"} />;
}
