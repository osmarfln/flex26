import { createFileRoute } from "@tanstack/react-router";
import heroCoffee from "@/assets/hero-coffee.jpg";
import pour from "@/assets/pour.jpg";
import roaster from "@/assets/roaster.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Verte — Small-batch coffee roastery" },
      {
        name: "description",
        content:
          "Maison Verte is a neighborhood coffee roastery sourcing single-origin beans and roasting them in small batches every week.",
      },
      { property: "og:title", content: "Maison Verte — Small-batch coffee roastery" },
      {
        property: "og:description",
        content:
          "Single-origin beans, roasted in small batches every week. Visit the roastery or order online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const origins = [
  {
    name: "Yirgacheffe",
    region: "Ethiopia · Gedeo",
    notes: "Bergamot · Jasmine · Stone fruit",
    roast: "Light",
    price: "$21",
  },
  {
    name: "Huehuetenango",
    region: "Guatemala · Highland",
    notes: "Dark chocolate · Brown sugar · Orange",
    roast: "Medium",
    price: "$19",
  },
  {
    name: "Sumatra Lintong",
    region: "Indonesia · Lake Toba",
    notes: "Cedar · Molasses · Dried fig",
    roast: "Dark",
    price: "$20",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="font-serif text-xl font-semibold tracking-tight">
              Maison Verte
            </span>
          </a>
          <ul className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <li><a className="transition-colors hover:text-foreground" href="#origins">Origins</a></li>
            <li><a className="transition-colors hover:text-foreground" href="#craft">The craft</a></li>
            <li><a className="transition-colors hover:text-foreground" href="#visit">Visit</a></li>
          </ul>
          <a
            href="#origins"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Shop beans
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col gap-6">
            <span className="eyebrow">Small-batch · Since 2011</span>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Coffee with a
              <br />
              <span className="italic text-primary">sense of place.</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              We source single-origin beans from growers we know by name and
              roast them in small batches every week — so every cup tastes of
              where it came from.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <a
                href="#origins"
                className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Explore the origins
              </a>
              <a
                href="#craft"
                className="text-sm font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
              >
                See how we roast →
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="grain overflow-hidden rounded-[2rem] border border-border/60 shadow-[0_30px_60px_-20px_oklch(0.22_0.03_35/0.35)]">
              <img
                src={heroCoffee}
                alt="Dark roasted coffee beans spilling from a burlap sack"
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border/60 bg-card px-5 py-3 shadow-lg sm:block">
              <p className="font-serif text-2xl font-semibold text-primary">12</p>
              <p className="text-xs text-muted-foreground">farms partnered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="border-y border-border/60 bg-cream-deep">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>Direct trade</span>
          <span className="text-primary">·</span>
          <span>Roasted weekly</span>
          <span className="text-primary">·</span>
          <span>Carbon-neutral shipping</span>
          <span className="text-primary">·</span>
          <span>Whole bean or ground</span>
        </div>
      </div>

      {/* Origins */}
      <section id="origins" className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <span className="eyebrow">This week's roasts</span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              Three origins, three stories.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            We rotate a small list so every bag is fresh. Roasted within seven
            days of shipping.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {origins.map((o) => (
            <article
              key={o.name}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_-24px_oklch(0.22_0.03_35/0.5)]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {o.roast} roast
                </span>
                <span className="font-serif text-2xl font-semibold text-primary">
                  {o.price}
                </span>
              </div>
              <h3 className="mt-5 font-serif text-2xl font-semibold">{o.name}</h3>
              <p className="text-sm text-muted-foreground">{o.region}</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                {o.notes}
              </p>
              <a
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:gap-3"
              >
                Add to bag
                <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Craft / process */}
      <section id="craft" className="bg-cream-deep">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <span className="eyebrow">The craft</span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              Roasted by hand, not by batch number.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Our 12kg drum roaster runs slow. We listen for the crack, watch
              the color, and cup every roast before it leaves the shop. Nothing
              ships that we wouldn't drink ourselves.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                ["Profiled", "Each origin gets its own roast curve"],
                ["Cupped", "Tasted blind before it's approved"],
                ["Dated", "Roast date printed on every bag"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 grid grid-cols-2 gap-4 md:order-2">
            <div className="grain overflow-hidden rounded-2xl border border-border/60">
              <img
                src={roaster}
                alt="Drum roaster in the Maison Verte roastery"
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-10 grid overflow-hidden rounded-2xl border border-border/60">
              <img
                src={pour}
                alt="A barista pouring a latte with latte art"
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section id="visit" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid overflow-hidden rounded-[2rem] border border-border/60 bg-ink text-cream md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6 p-10 md:p-14">
            <span className="eyebrow !text-terra">Visit us</span>
            <h2 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Pull up a stool at the roastery bar.
            </h2>
            <p className="max-w-md text-cream/80 leading-relaxed">
              Watch a roast, drink what just came off the drum, and talk coffee
              with the people who made it. No reservation needed.
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="text-cream/50">Address</dt>
                <dd className="mt-1 font-medium">48 Rue des Grains, 11e</dd>
              </div>
              <div>
                <dt className="text-cream/50">Hours</dt>
                <dd className="mt-1 font-medium">Wed–Sun · 8–16h</dd>
              </div>
            </dl>
            <div className="mt-2">
              <a
                href="#"
                className="inline-flex rounded-full bg-cream px-7 py-3 text-sm font-semibold text-ink transition-colors hover:bg-cream/90"
              >
                Get directions
              </a>
            </div>
          </div>
          <div className="relative min-h-[260px] bg-terra-deep md:min-h-full">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, oklch(0.7 0.13 50 / 0.6), transparent 60%), radial-gradient(circle at 80% 70%, oklch(0.55 0.1 145 / 0.5), transparent 55%)",
              }}
            />
            <div className="grain absolute inset-0" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-cream-deep">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="font-serif text-lg font-semibold text-foreground">
              Maison Verte
            </span>
          </div>
          <p>© {new Date().getFullYear()} Maison Verte Roastery. Roasted with care.</p>
          <div className="flex gap-6">
            <a className="transition-colors hover:text-foreground" href="#">Instagram</a>
            <a className="transition-colors hover:text-foreground" href="#">Newsletter</a>
            <a className="transition-colors hover:text-foreground" href="#">Wholesale</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
