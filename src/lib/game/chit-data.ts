/**
 * Data-driven chit items per category.
 * Adding a new category = add an entry here + one in `categories.ts`.
 * No gameplay logic depends on these values.
 */

export interface ChitItem {
  id: string;
  label: string;
  emoji: string;
}

const item = (label: string, emoji: string): ChitItem => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  label,
  emoji,
});

export const CHIT_ITEMS: Record<string, ChitItem[]> = {
  fruits: [
    item("Mango", "🥭"),
    item("Apple", "🍎"),
    item("Banana", "🍌"),
    item("Grapes", "🍇"),
    item("Watermelon", "🍉"),
    item("Pineapple", "🍍"),
    item("Strawberry", "🍓"),
    item("Cherry", "🍒"),
  ],
  cars: [
    item("BMW", "🚗"),
    item("Audi", "🏎️"),
    item("Tesla", "⚡"),
    item("Jeep", "🚙"),
    item("Ferrari", "🔴"),
    item("Toyota", "🚘"),
    item("Mini", "🚕"),
    item("Volvo", "🚐"),
  ],
  bikes: [
    item("Ducati", "🏍️"),
    item("Royal Enfield", "🛵"),
    item("Yamaha", "🏁"),
    item("Harley", "🛞"),
    item("KTM", "🧡"),
    item("Honda", "⚙️"),
    item("BMW GS", "🗺️"),
    item("Vespa", "🛺"),
  ],
  animals: [
    item("Tiger", "🐯"),
    item("Elephant", "🐘"),
    item("Panda", "🐼"),
    item("Fox", "🦊"),
    item("Lion", "🦁"),
    item("Deer", "🦌"),
    item("Monkey", "🐒"),
    item("Zebra", "🦓"),
  ],
  birds: [
    item("Peacock", "🦚"),
    item("Parrot", "🦜"),
    item("Owl", "🦉"),
    item("Eagle", "🦅"),
    item("Flamingo", "🦩"),
    item("Swan", "🦢"),
    item("Penguin", "🐧"),
    item("Dove", "🕊️"),
  ],
  vegetables: [
    item("Carrot", "🥕"),
    item("Tomato", "🍅"),
    item("Broccoli", "🥦"),
    item("Corn", "🌽"),
    item("Potato", "🥔"),
    item("Chilli", "🌶️"),
    item("Onion", "🧅"),
    item("Cucumber", "🥒"),
  ],
  sports: [
    item("Cricket", "🏏"),
    item("Football", "⚽"),
    item("Tennis", "🎾"),
    item("Hockey", "🏑"),
    item("Basketball", "🏀"),
    item("Badminton", "🏸"),
    item("Boxing", "🥊"),
    item("Chess", "♟️"),
  ],
  countries: [
    item("India", "🇮🇳"),
    item("Japan", "🇯🇵"),
    item("Brazil", "🇧🇷"),
    item("Kenya", "🇰🇪"),
    item("France", "🇫🇷"),
    item("Canada", "🇨🇦"),
    item("Egypt", "🇪🇬"),
    item("Norway", "🇳🇴"),
  ],
  movies: [
    item("Sholay", "🎬"),
    item("Inception", "🌀"),
    item("Dangal", "🤼"),
    item("Titanic", "🚢"),
    item("Avatar", "🌌"),
    item("3 Idiots", "🎓"),
    item("Interstellar", "🪐"),
    item("Jaws", "🦈"),
  ],
  personalities: [
    item("Tagore", "📖"),
    item("Einstein", "🧠"),
    item("Kalam", "🚀"),
    item("Curie", "⚗️"),
    item("Tendulkar", "🏏"),
    item("Chaplin", "🎩"),
    item("Mandela", "🕊️"),
    item("Ada", "💻"),
  ],
};

export const FALLBACK_ITEMS = CHIT_ITEMS.fruits;

export function getItemsForCategory(categoryId: string): ChitItem[] {
  return CHIT_ITEMS[categoryId] ?? FALLBACK_ITEMS;
}
