import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";
import { ArchetypeValues } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 7); // 7-character random string

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

// Function to check if the archetype values match in scores and report objects
export function haveMatchingArchetypeValues(scores: ArchetypeValues, report: ArchetypeValues): boolean {
  const archetypes: (keyof ArchetypeValues)[] = [
    "explorer",
    "analyst",
    "designer",
    "optimizer",
    "connector",
    "nurturer",
    "energizer",
    "achiever",
  ];

  for (const archetype of archetypes) {
    if (scores[archetype] !== report[archetype]) {
      return false;
    }
  }

  return true;
}

export function getRelativePercentages({
  explorer,
  analyst,
  designer,
  optimizer,
  connector,
  nurturer,
  energizer,
  achiever,
}: ArchetypeValues) {
  // Convert string values to numbers and calculate the total score
  const totalScore = [explorer, analyst, designer, optimizer, connector, nurturer, energizer, achiever]
    .map((score) => parseFloat(score))
    .reduce((sum, current) => sum + current, 0);

  // Calculate relative percentages
  const relativePercentages = [explorer, analyst, designer, optimizer, connector, nurturer, energizer, achiever].map(
    (score) => ((parseFloat(score) / totalScore) * 100).toFixed(1)
  );

  return relativePercentages;
}
