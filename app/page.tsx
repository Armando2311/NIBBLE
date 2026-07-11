import type { Metadata } from "next";
import { NibbleApp } from "./components/NibbleApp";

export const metadata: Metadata = {
  title: "Nibble — Engineering project cockpit",
  description:
    "A private engineering workspace for projects, technical files, validation, and revision control.",
};

export default function Home() {
  return <NibbleApp />;
}
