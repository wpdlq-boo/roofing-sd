import { LoginForm } from "./login-form";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { reason } = await searchParams;
  return <LoginForm reason={typeof reason === "string" ? reason : undefined} />;
}
