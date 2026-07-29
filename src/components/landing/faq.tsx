import { Section, SectionHeader } from "@/components/shared/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  { q: "What is ChitSet?", a: "ChitSet is a modern, real-time online take on the traditional Indian 4 Chit game. Create a room, invite friends, and race to collect four matching chits." },
  { q: "Is it free?", a: "Yes. ChitSet is completely free to play. No ads, no signup, no gimmicks." },
  { q: "Can I play on mobile?", a: "Absolutely. The interface is designed mobile-first and works on any modern browser." },
  { q: "Do I need an account?", a: "Not to play. Just pick a name, hop into a room, and start the round." },
  { q: "How many players can join?", a: "Rooms currently support two to four players. Additional modes are on the way." },
] as const;

export function FAQ() {
  return (
    <Section id="faq" className="bg-muted/30">
      <SectionHeader
        eyebrow="FAQ"
        title="Good questions, short answers."
      />
      <div className="mx-auto max-w-2xl">
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-5 shadow-soft"
            >
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
