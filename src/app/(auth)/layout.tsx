import { Wordmark } from "@/components/ui/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Wordmark />
        </div>
        {children}
      </div>
    </div>
  );
}
