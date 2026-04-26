// All unlockable items for horse customization
// unlockLevel = minimum level required to use the item

export const JOCKEY_COLORS = [
  { id: "chestnut",  label: "Chestnut",  color: "#A0522D", unlockLevel: 1 },
  { id: "bay",       label: "Bay",       color: "#3E2723", unlockLevel: 1 },
  { id: "black",     label: "Black",     color: "#1e293b", unlockLevel: 1 },
  { id: "dun",       label: "Dun",       color: "#D4A574", unlockLevel: 2 },
  { id: "roan",      label: "Roan",      color: "#8B7355", unlockLevel: 3 },
  { id: "gray",      label: "Gray",      color: "#A9A9A9", unlockLevel: 4 },
  { id: "palomino",  label: "Palomino",  color: "#FFD700", unlockLevel: 5 },
  { id: "pinto",     label: "Pinto",     color: "#F5DEB3", unlockLevel: 5 },
];

export const HORSE_SKINS = [
  { id: "brown",   label: "Brown",   emoji: "🐴", unlockLevel: 1 },
  { id: "white",   label: "White",   emoji: "🐇", unlockLevel: 2 },
  { id: "unicorn", label: "Unicorn", emoji: "🦄", unlockLevel: 5 },
  { id: "dark",    label: "Dark",    emoji: "🐴", unlockLevel: 10 },
];

export const SADDLES = [
  { id: "none",    label: "None",         emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "basic",   label: "Basic Saddle", emoji: "🏅", bonus: 5,  unlockLevel: 1 },
  { id: "leather", label: "Leather",      emoji: "🟤", bonus: 10, unlockLevel: 2 },
  { id: "silver",  label: "Silver",       emoji: "⚪", bonus: 18, unlockLevel: 3 },
  { id: "golden",  label: "Golden",       emoji: "🟡", bonus: 28, unlockLevel: 4 },
  { id: "royal",   label: "Royal Throne", emoji: "👑", bonus: 40, unlockLevel: 5 },
];

export const SHOES = [
  { id: "none",     label: "None",          emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "iron",     label: "Iron Shoes",    emoji: "🔩", bonus: 5,  unlockLevel: 1 },
  { id: "silver",   label: "Silver Shoes",  emoji: "🥈", bonus: 12, unlockLevel: 4 },
  { id: "gold",     label: "Gold Shoes",    emoji: "🥇", bonus: 20, unlockLevel: 7 },
  { id: "rocket",   label: "Rocket Boots",  emoji: "🚀", bonus: 32, unlockLevel: 9 },
  { id: "lightning",label: "Lightning",     emoji: "⚡", bonus: 45, unlockLevel: 10 },
];

export const ARMORS = [
  { id: "none",     label: "None",          emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "cloth",    label: "Cloth Wrap",    emoji: "🎀", bonus: 3,  unlockLevel: 1 },
  { id: "leather",  label: "Leather Armor", emoji: "🦺", bonus: 8,  unlockLevel: 2 },
  { id: "chainmail",label: "Chainmail",     emoji: "⛓️", bonus: 15, unlockLevel: 3 },
  { id: "plate",    label: "Plate Armor",   emoji: "🛡️", bonus: 25, unlockLevel: 4 },
  { id: "dragon",   label: "Dragon Scale",  emoji: "🐉", bonus: 38, unlockLevel: 5 },
];

export const ACCESSORIES = [
  { id: "none",      label: "None",          emoji: "",   bonus: 0,  unlockLevel: 1 },
  { id: "ribbon",    label: "Ribbon",        emoji: "🎀", bonus: 2,  unlockLevel: 1 },
  { id: "hat",       label: "Lucky Hat",     emoji: "🎩", bonus: 6,  unlockLevel: 2 },
  { id: "clover",    label: "Lucky Clover",  emoji: "🍀", bonus: 10, unlockLevel: 2 },
  { id: "star",      label: "Star Power",    emoji: "⭐", bonus: 16, unlockLevel: 3 },
  { id: "flame",     label: "Flame Aura",    emoji: "🔥", bonus: 24, unlockLevel: 4 },
  { id: "crown",     label: "Champion Crown",emoji: "👑", bonus: 35, unlockLevel: 5 },
];

export function getHorseEmoji(skin) {
  return HORSE_SKINS.find(s => s.id === skin)?.emoji || "🐴";
}

export function getTotalBonus(stable) {
  const saddleBonus = SADDLES.find(s => s.id === stable?.saddle)?.bonus || 0;
  const shoesBonus  = SHOES.find(s => s.id === stable?.shoes)?.bonus  || 0;
  const armorBonus  = ARMORS.find(s => s.id === stable?.armor)?.bonus  || 0;
  const accBonus    = ACCESSORIES.find(s => s.id === stable?.accessory)?.bonus || 0;
  return saddleBonus + shoesBonus + armorBonus + accBonus;
}

export function getEquippedEmojis(stable) {
  const saddle = SADDLES.find(s => s.id === stable?.saddle);
  const shoes  = SHOES.find(s => s.id === stable?.shoes);
  const armor  = ARMORS.find(s => s.id === stable?.armor);
  const acc    = ACCESSORIES.find(s => s.id === stable?.accessory);
  return [saddle, shoes, armor, acc]
    .filter(i => i && i.emoji)
    .map(i => i.emoji);
}