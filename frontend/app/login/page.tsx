import LoginForm from "@/components/forms/LoginForm";
import Navbar from "@/components/navbar/Navbar";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <LoginForm />
      </main>
    </div>
  );
}