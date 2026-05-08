export const CAT_FURS = [
  { id: "orange",   label: "Orange",   emoji: "🐈",  unlockLevel: 1 },
  { id: "black",    label: "Black",    emoji: "🐈‍⬛", unlockLevel: 1 },
  { id: "white",    label: "White",    emoji: "🐱",  unlockLevel: 1 },
  { id: "gray",     label: "Gray",     emoji: "🐱",  unlockLevel: 2 },
  { id: "calico",   label: "Calico",   emoji: "🐈",  unlockLevel: 3 },
  { id: "tabby",    label: "Tabby",    emoji: "🐈",  unlockLevel: 4 },
  { id: "siamese",  label: "Siamese",  emoji: "🐱",  unlockLevel: 5 },
  { id: "tuxedo",   label: "Tuxedo",   emoji: "🐈‍⬛", unlockLevel: 6 },
];

export const COLLARS = [
  { id: "none",     label: "None",          emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "ribbon",   label: "Ribbon",        emoji: "🎀", bonus: 5,  unlockLevel: 1 },
  { id: "bell",     label: "Bell Collar",   emoji: "🔔", bonus: 10, unlockLevel: 2 },
  { id: "pearl",    label: "Pearl Collar",  emoji: "⚪", bonus: 18, unlockLevel: 3 },
  { id: "diamond",  label: "Diamond Collar",emoji: "💎", bonus: 28, unlockLevel: 4 },
  { id: "gold",     label: "Gold Collar",   emoji: "🟡", bonus: 40, unlockLevel: 5 },
  { id: "royal",    label: "Royal Jewels",  emoji: "👑", bonus: 55, unlockLevel: 8 },
];

export const TOYS = [
  { id: "none",     label: "None",          emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "mouse",    label: "Toy Mouse",     emoji: "🐭", bonus: 5,  unlockLevel: 1 },
  { id: "yarn",     label: "Yarn Ball",     emoji: "🧶", bonus: 10, unlockLevel: 2 },
  { id: "laser",    label: "Laser Pointer", emoji: "🔴", bonus: 18, unlockLevel: 3 },
  { id: "wand",     label: "Feather Wand",  emoji: "🪶", bonus: 28, unlockLevel: 5 },
  { id: "drone",    label: "Drone Toy",     emoji: "🚁", bonus: 40, unlockLevel: 7 },
  { id: "fish",     label: "Robotic Fish",  emoji: "🐟", bonus: 55, unlockLevel: 10 },
];

export const ACCESSORIES = [
  { id: "none",     label: "None",          emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "bow",      label: "Bow Tie",       emoji: "🎀", bonus: 5,  unlockLevel: 1 },
  { id: "hat",      label: "Party Hat",     emoji: "🎉", bonus: 10, unlockLevel: 2 },
  { id: "glasses",  label: "Sunglasses",    emoji: "🕶️", bonus: 15, unlockLevel: 3 },
  { id: "cape",     label: "Mini Cape",     emoji: "🦸", bonus: 25, unlockLevel: 4 },
  { id: "crown",    label: "Crown",         emoji: "👑", bonus: 35, unlockLevel: 6 },
  { id: "wings",    label: "Angel Wings",   emoji: "🪽", bonus: 50, unlockLevel: 9 },
];

export function getCatEmoji(fur) {
  return CAT_FURS.find(f => f.id === fur)?.emoji || "🐱";
}

export function getCatEquippedEmojis(cat) {
  const collar    = COLLARS.find(c => c.id === cat?.collar);
  const toy       = TOYS.find(t => t.id === cat?.toy);
  const accessory = ACCESSORIES.find(a => a.id === cat?.accessory);
  return [collar, toy, accessory].filter(i => i && i.emoji).map(i => i.emoji);
}

export function getCatTotalBonus(cat) {
  const collarBonus    = COLLARS.find(c => c.id === cat?.collar)?.bonus || 0;
  const toyBonus       = TOYS.find(t => t.id === cat?.toy)?.bonus || 0;
  const accessoryBonus = ACCESSORIES.find(a => a.id === cat?.accessory)?.bonus || 0;
  return collarBonus + toyBonus + accessoryBonus;
}