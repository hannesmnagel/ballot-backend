import Link from "next/link";

const screens = [
  { title: "Landing", href: "/", note: "Problem framing + CTA" },
  { title: "Auth Entry", href: "/auth", note: "Choose email/password or passkey" },
  { title: "Signup", href: "/auth/signup", note: "Creator registration" },
  { title: "Login", href: "/auth/login", note: "Creator login" },
  { title: "Forgot Password", href: "/auth/forgot", note: "Password reset request" },
  { title: "Reset Password", href: "/auth/reset?token=demo-token", note: "Reset form" },
  { title: "Verify Email", href: "/auth/verify?token=demo-token", note: "Email verification status" },
  { title: "Dashboard", href: "/dashboard", note: "Creator polls overview" },
  { title: "Create Poll", href: "/polls/new", note: "Poll wizard first pass" },
  { title: "Settings", href: "/settings", note: "Passkey setup/login" }
];

export default function MockupPage() {
  return (
    <main className="grid-gap">
      <section className="card grid-gap">
        <h1 className="text-2xl font-semibold">Ballot HTML Mockup</h1>
        <p className="text-sm text-slate-600">
          First-pass mobile mockup implemented as real app screens. Open each screen below.
        </p>
      </section>

      <section className="grid gap-3">
        {screens.map((screen) => (
          <article key={screen.title} className="card grid-gap">
            <h2 className="text-lg font-semibold">{screen.title}</h2>
            <p className="text-sm text-slate-600">{screen.note}</p>
            <Link href={screen.href} className="btn btn-primary">Open Screen</Link>
          </article>
        ))}
      </section>

      <section className="card grid-gap">
        <h2 className="text-lg font-semibold">Public Poll Flow</h2>
        <p className="text-sm text-slate-600">
          Create a poll in dashboard, then open its public URL to view live voter ballot, thanks, and results pages.
        </p>
      </section>
    </main>
  );
}
