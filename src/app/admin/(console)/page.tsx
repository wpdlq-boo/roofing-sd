import Link from "next/link";
import { ArrowRight, CircleHelp, Images, Mail, Plus, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function counts() {
  const supabase = await createClient();
  const count = async (table: string, column?: string) => {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (column) query = query.eq(column, true);
    const { count } = await query;
    return count ?? 0;
  };
  const [projects, published, services, visibleServices, faqs, visibleFaqs] = await Promise.all([
    count("portfolio_projects"),
    count("portfolio_projects", "is_published"),
    count("services"),
    count("services", "is_visible"),
    count("faqs"),
    count("faqs", "is_visible"),
  ]);
  return { projects, published, services, visibleServices, faqs, visibleFaqs };
}

export default async function AdminDashboard() {
  const c = await counts();

  const modules = [
    {
      href: "/admin/portfolio",
      icon: Images,
      title: "Manage Portfolio",
      stat: `${c.projects} ${c.projects === 1 ? "project" : "projects"}`,
      detail: `${c.published} published · ${c.projects - c.published} draft`,
      text: "Add completed projects with photos, choose the cover photo, and publish or unpublish them.",
      action: "Add a project",
    },
    {
      href: "/admin/services",
      icon: Wrench,
      title: "Manage Services",
      stat: `${c.services} ${c.services === 1 ? "service" : "services"}`,
      detail: `${c.visibleServices} shown on the website`,
      text: "Edit service names, descriptions, and images, change their order, or hide them.",
      action: "Add a service",
    },
    {
      href: "/admin/faqs",
      icon: CircleHelp,
      title: "Manage FAQs",
      stat: `${c.faqs} ${c.faqs === 1 ? "question" : "questions"}`,
      detail: `${c.visibleFaqs} shown on the website`,
      text: "Add answers to questions customers often ask by phone or email.",
      action: "Add an FAQ",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary shadow-md sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-80 rounded-full bg-secondary-container/10 blur-3xl" aria-hidden />
        <div className="relative max-w-3xl space-y-2">
          <h1 className="text-headline-lg">Welcome back</h1>
          <p className="text-body-md text-primary-fixed-dim">
            Manage the projects, services, and FAQs shown on your website. Changes appear on the
            public site within a minute of saving.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {modules.map(({ href, icon: Icon, title, stat, detail, text, action }) => (
          <article key={href} className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <div className="space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary-container">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-headline-sm text-on-surface">{title}</h2>
              <div>
                <p className="text-headline-md text-on-surface">{stat}</p>
                <p className="text-sm text-on-surface-variant">{detail}</p>
              </div>
              <p className="text-sm text-on-surface-variant">{text}</p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={href}
                className="touch-target flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 text-label-lg text-on-primary hover:bg-primary"
              >
                Open {title.replace("Manage ", "")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={`${href}?new=1`}
                className="touch-target flex items-center justify-center gap-2 rounded-lg bg-surface-container-low px-4 text-label-md text-primary hover:bg-surface-container"
              >
                <Plus className="size-4" aria-hidden />
                {action}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="flex items-start gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
          <Mail className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-headline-sm text-on-surface">Quote requests</h2>
          <p className="text-sm text-on-surface-variant">
            Quote requests are sent straight to your email inbox, with any photos attached. They are
            not saved on the website. Reply to the email to answer the customer.
          </p>
        </div>
      </section>
    </div>
  );
}
