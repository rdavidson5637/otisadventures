export function getRotation(id: string): number {
  const num = parseInt(id.replace(/-/g, "").slice(0, 8), 16);
  return ((num % 40) - 20) / 10;
}

export const CATEGORY_COLORS: Record<string, string> = {
  farm: "#4A7C59",
  nature: "#5B8DB8",
  beach: "#F5C842",
  indoor: "#D4614E",
  castle: "#8B6BA8",
};

export const CATEGORY_LABELS: Record<string, string> = {
  farm: "🐄 Farms",
  nature: "🌿 Nature",
  beach: "🏖️ Beaches",
  indoor: "🏛️ Indoors",
  castle: "🏰 Castles",
};

export const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: "🌅 Morning",
  breakfast: "🍳 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  bedtime: "😴 Bedtime",
  nap: "💤 Nap time",
  moment: "⭐ Funny moment",
};

export const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: "#F5C842",
  lunch: "#4A7C59",
  dinner: "#1E2D4A",
  snack: "#D4614E",
};
