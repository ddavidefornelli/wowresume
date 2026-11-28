import Link from "next/link";
import { PixelBackground } from "./pixel-background";
import { ResumeChecker } from "./resume-checker";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#0a0a0a] px-4 pb-20 text-[#ededed]">
      <PixelBackground />
      <div className="relative flex w-full flex-col items-center">
        {/* hero fills 95% of the screen so the next section peeks in below */}
        <div className="flex min-h-[95svh] w-full flex-col items-center justify-center py-12">
          <h1 className="max-w-5xl text-center text-[44px] font-bold leading-[0.95] tracking-[-0.065em] sm:text-7xl lg:text-[104px]">
            We do the work.{" "}
            <span className="block text-[#4ade80]">You get the job.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-center text-lg leading-snug tracking-[-0.02em] text-[#a3a3a3] sm:text-2xl">
            We turn your projects and experience into a resume made for the
            exact job you want. You just hit apply.
          </p>

          <Link
            href="/welcome"
            className="group mt-8 flex h-14 w-full max-w-md items-center justify-center rounded-full bg-[#ededed] text-xl font-medium text-[#0a0a0a] transition-colors hover:bg-white sm:h-[60px] sm:text-2xl"
          >
            Start for free
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <ResumeChecker />
      </div>
    </div>
  );
}
