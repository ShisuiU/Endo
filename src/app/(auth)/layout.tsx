import { Wordmark } from "@/components/ui/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-8 py-12">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-1">
          <Wordmark className="!text-[3.4rem] !text-accent" />
        </div>
        <div className="hairline-b mb-7" />
        {children}
      </div>
    </div>
  );
}
