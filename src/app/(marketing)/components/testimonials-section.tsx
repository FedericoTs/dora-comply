/**
 * TestimonialsSection Component
 *
 * Customer testimonials and social proof.
 */

'use client';

import { Quote, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const TESTIMONIALS = [
  {
    quote: "DORA Comply reduced our vendor assessment time by 90%. What used to take weeks now takes hours. The AI parsing is remarkably accurate.",
    author: "Maria van der Berg",
    role: "Head of Third-Party Risk",
    company: "Major EU Bank",
    rating: 5,
  },
  {
    quote: "Finally, a platform that understands EU regulations. The RoI export feature alone saved us 200+ hours of manual work.",
    author: "Thomas Weber",
    role: "Chief Compliance Officer",
    company: "Insurance Group",
    rating: 5,
  },
  {
    quote: "The cross-framework mapping is invaluable. We can now see our DORA, NIS2, and ISO 27001 compliance in one view.",
    author: "Sophie Laurent",
    role: "VP of Risk Management",
    company: "Investment Firm",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by compliance leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why EU financial institutions choose DORA Comply
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={i}
              className={cn(
                "relative p-8 rounded-2xl bg-slate-50 border transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-primary/20 mb-4" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
