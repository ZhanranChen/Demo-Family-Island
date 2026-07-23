import type { Metadata } from "next";
import { DemoExperience } from "@/features/demo/demo-experience";
import "@/features/demo/demo.css";

export const metadata: Metadata = {
  title: "Family Island Interactive Demo",
  description: "Write a family memory and watch your shared island grow.",
};

export default function DemoPage() {
  return <DemoExperience />;
}
