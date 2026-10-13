import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StillHaveQuestions } from "@/components/still-have-questions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqCategories, site } from "@/config/site";
import { getVisibleFaqs } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: `Answers to common questions about roofing and renovation services from ${site.shortName} in ${site.serviceArea}.`,
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getVisibleFaqs();
  const groups = faqCategories
    .map((category) => ({ category, items: faqs.filter((f) => f.category === category) }))
    .filter((g) => g.items.length > 0); // Empty categories are hidden (FQ-01).

  // FAQ structured data (OR-08).
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "FAQ" }]}
        eyebrow="Help"
        title="Frequently Asked Questions"
        intro={<p>Answers to the questions we hear most often. Select a question to see the answer.</p>}
      />

      {groups.length === 0 ? (
        // SRS 3.2.9.5
        <p className="rounded-xl bg-surface-container-low p-6 text-body-lg text-on-surface">
          Our FAQs are being updated. Please call or email us with any questions.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map(({ category, items }) => (
            <section key={category} aria-labelledby={`faq-${category}`}>
              <h2 id={`faq-${category}`} className="mb-4 text-headline-lg text-primary">
                {category}
              </h2>
              {/* Several answers can be open at once; keyboard and screen-reader
                  support come from the accordion (FQ-02, FQ-03). */}
              <Accordion multiple className="rounded-xl bg-surface-container-lowest px-6 shadow-sm">
                {items.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-border">
                    <AccordionTrigger className="touch-target py-5 text-headline-sm text-primary hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      {/* Plain text with the admin's line breaks (FQ-04, FM-07). */}
                      <p className="text-body-md whitespace-pre-line text-on-surface-variant">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}

      <StillHaveQuestions />

      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
        />
      )}
    </>
  );
}
