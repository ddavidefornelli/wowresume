import type { Metadata } from "next";
import { OnboardingClient } from "./client";

export const metadata: Metadata = {
  title: "Build your path to hired — wowresume",
  description: "A few quick questions, then a plan and a resume tailored to the job you want.",
};

export default function WelcomePage() {
  return <OnboardingClient />;
}
