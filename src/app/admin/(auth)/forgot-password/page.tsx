import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/admin/forgot-password">) {
  const { expired } = await searchParams;
  return <ForgotForm expired={expired === "1"} />;
}
