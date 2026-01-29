
import type { StoryData } from '../types';

/**
 * 🏛️ THE RAWY HERITAGE STORYBOARD LIBRARY
 * Each theme is mapped to a structural 5-phase arc and regional cultural anchors.
 */
const guidelines: Record<string, string> = {
  // --- VALUES ---
  'val-sleep': `
**Heritage Context:** The Vast Arabian Night & Bedouin Hospitality.
**Planner Beats:**
1. **Setup:** {child_name}'s room overlooks a modern skyline meeting the desert edge.
2. **Catalyst:** Closing eyes, the walls dissolve into a silken tent smelling of sandalwood.
3. **Escalation:** Exploring a dream-desert where dunes are made of glitter; meeting a moon-owl.
4. **Shift:** Realizing rest keeps the stars glowing for all travelers.
5. **Resolution:** Waking as the sun touches the minarets, refreshed and heroic.
**Visual Style:** Indigo/gold palette, Mashrabiya patterns, glowing crescent moon.
`,
  'val-respect': `
**Heritage Context:** The Majlis and the Wisdom of "Kibar Al Sin" (Elders).
**Planner Beats:**
1. **Setup:** A warm courtyard house; {child_name} helps Jaddi (Grandpa) with coffee.
2. **Catalyst:** Jaddi opens an old Mandoos (chest) filled with history.
3. **Escalation:** The Majlis fades into a scene of an old harbor as Jaddi tells a tale.
4. **Shift:** {child_name} sees Jaddi's wrinkled hands as a map to amazing worlds.
5. **Resolution:** Listening with reverence, understanding respect is a key to wisdom.
**Visual Style:** Cedar wood textures, Zellige tiles, golden Dallah (coffee pots).
`,
  'val-siblings': `
**Heritage Context:** The Bond of the Fareej (Neighborhood) and the Pearl Divers.
**Planner Beats:**
1. **Setup:** Siblings playing in a traditional alleyway near the sea.
2. **Catalyst:** Finding a "lost pearl" or a cryptic message on a shell.
3. **Escalation:** "Sailing" a cushion-boat through a storm of imaginary bubbles.
4. **Shift:** One sibling holds the light, the other steers; realizing they are a crew.
5. **Resolution:** Success! Finding the treasure and realizing their bond is the real prize.
**Visual Style:** Coastal blues, nautical ropes, sparkling pearl finishes.
`,
  'val-dentist': `
**Heritage Context:** The Bravery of the Desert Knight.
**Planner Beats:**
1. **Setup:** Preparing for the "Mission to the Bright Citadel" (The Dentist).
2. **Catalyst:** {child_name} puts on an imaginary cape of courage.
3. **Escalation:** The dentist's chair becomes a spaceship cockpit; the bright light is a sun.
4. **Shift:** Realizing that caring for your "shield" (teeth) is what a protector does.
5. **Resolution:** Leaving with a shiny sticker and a smile as bright as a lighthouse.
**Visual Style:** Pristine whites, tech-futurism mixed with soft nursery colors.
`,
  'val-honesty': `
**Heritage Context:** The Clarity of the Oasis Spring.
**Planner Beats:**
1. **Setup:** {child_name} accidentally breaks something or hides a small truth.
2. **Catalyst:** The world starts feeling "heavy" or colors seem dull.
3. **Escalation:** A small bird (the voice of truth) leads them to a mirror-like oasis.
4. **Shift:** {child_name} speaks the truth; the weight lifts and the oasis blooms.
5. **Resolution:** Returning home with a "heart of gold" and a clear, happy spirit.
**Visual Style:** Crystal clear water reflections, bright sunbeams, lush palm greenery.
`,
  'val-helping': `
**Heritage Context:** Planting the Ghaf Tree (The National Tree of Giving).
**Planner Beats:**
1. **Setup:** {child_name} sees a neighbor or an animal struggling in the sun.
2. **Catalyst:** Deciding to share water or shade, planting a symbolic seed of kindness.
3. **Escalation:** The act of help ripples through the neighborhood (Al Fareej).
4. **Shift:** Seeing the shade grow; realizing a small hand can create a giant tree of life.
5. **Resolution:** The community gathered under the shade {child_name} helped create.
**Visual Style:** Earthy tones, detailed Ghaf leaf textures, warm communal energy.
`,
  'val-tidy': `
**Heritage Context:** Protecting the Beauty of our Land.
**Planner Beats:**
1. **Setup:** The room/play-area is a "jungle" of toys and clutter.
2. **Catalyst:** A friendly Oryx figurine "wakes up" and asks for a clear path home.
3. **Escalation:** {child_name} organizes the room like a master architect building a city.
4. **Shift:** Seeing the beauty in order; finding a "lost" favorite toy in the process.
5. **Resolution:** The Oryx returns to its shelf; the room is a peaceful sanctuary.
**Visual Style:** Clean geometric compositions, soft pastel "organized" spaces.
`,
  'val-sharing-toys': `
**Heritage Context:** The Tradition of the Shared Plate (Karam).
**Planner Beats:**
1. **Setup:** {child_name} has a new toy or a tray of dates but wants it all.
2. **Catalyst:** A visitor arrives; the toy/food starts to feel "smaller" when kept alone.
3. **Escalation:** Deciding to share; the toy magically allows two to play in a bigger world.
4. **Shift:** Seeing the friend's smile; realizing joy isn't divided by sharing, it's multiplied.
5. **Resolution:** A celebration of friendship where everyone has enough.
**Visual Style:** Warm candlelight, rich textile patterns (Sadu), generous portions.
`,

  // --- ADVENTURES ---
  'adv-lost-found': `
**Heritage Context:** Falconry (Al Miqnas) and the Singing Dunes of the Desert.
**Planner Beats:**
1. **Setup:** The prize falcon "Zahi" has flown toward the rising sun over the dunes.
2. **Catalyst:** Finding a single golden feather near an ancient desert rock.
3. **Escalation:** Crossing the vast Empty Quarter; the wind whispers clues in the sand.
4. **Shift:** Facing a wise Sand Spirit who asks for a story in exchange for the path.
5. **Resolution:** Zahi returns to {child_name}'s arm under a sky of a million stars.
**Visual Style:** Wide-angle desert vistas, soaring falcon silhouettes, orange/teal contrast.
`,
  'adv-mini-nature': `
**Heritage Context:** The Hidden Aflaj (Ancient Irrigation Systems) in a Palm Grove.
**Planner Beats:**
1. **Setup:** {child_name} follows a dragon-fly into a hidden palm grove.
2. **Catalyst:** Discovering a secret water channel that glows with magic.
3. **Escalation:** Navigating the labyrinth of green fronds to find the source.
4. **Shift:** Realizing the water is the heartbeat of the land.
5. **Resolution:** Saving a small flower by directing the water, becoming a Guardian.
**Visual Style:** Dappled sunlight through palm leaves, sparkling water, vibrant dragonflies.
`,
  'adv-daily': `
**Heritage Context:** The Sensory Magic of the Old Souq (Traditional Market).
**Planner Beats:**
1. **Setup:** A simple trip to the bustling Old Souq with a shopping list.
2. **Catalyst:** A merchant gifts {child_name} a "magic" spice jar in his stall.
3. **Escalation:** Smelling the jar transforms the market aisles into a cavern of flying carpets.
4. **Shift:** Helping a lost merchant find his way through the incense smoke.
5. **Resolution:** Coming home with bread and honey, knowing every street holds magic.
**Visual Style:** Crimson saffron piles, glowing lanterns, bustling market energy.
`,
  'adv-animal': `
**Heritage Context:** The Mystery of the Arabian Oryx in the Wild.
**Planner Beats:**
1. **Setup:** {child_name} finds a thirsty Oryx at the edge of the wildlife sanctuary.
2. **Catalyst:** The Oryx speaks! It needs help finding the "Last Wild Lily."
3. **Escalation:** Riding the Oryx across a moonlit plain, meeting a desert fox.
4. **Shift:** Protecting the Lily from a sandstorm using a blanket.
5. **Resolution:** The Lily blooms, restoring the desert's scent; a secret friendship formed.
**Visual Style:** Ethereal moonlight, silvery Oryx coats, glowing desert flora.
`,
  'adv-magic-obj': `
**Heritage Context:** 1001 Nights & The Flying Carpet over the City.
**Planner Beats:**
1. **Setup:** Exploring an attic and finding a dusty, patterned rug.
2. **Catalyst:** {child_name} sits on it and says "Fly!"; the rug shudders and lifts.
3. **Escalation:** Soaring over the Burj Khalifa and the ancient forts of Oman.
4. **Shift:** The rug gets caught in a kite string; {child_name} must use ingenuity to free it.
5. **Resolution:** Landing safely back home, the rug now a cozy reading spot.
**Visual Style:** High-altitude views, intricate carpet fringes, wind-blown hair.
`,
  'adv-fantasy': `
**Heritage Context:** The Legend of the Sea Djinn & The Pearl Lighthouse underwater.
**Planner Beats:**
1. **Setup:** {child_name} builds a sandcastle that is "too perfect" on the beach.
2. **Catalyst:** At sunset, the castle turns into stone and a tiny door opens.
3. **Escalation:** Shrinking down to enter a world of coral palaces and sea-turtles.
4. **Shift:** Helping the Turtle King find his lost crown in a kelp forest.
5. **Resolution:** Returning to normal size as the tide comes in, holding a real seashell.
**Visual Style:** Bioluminescent corals, turquoise water, shimmering scales.
`,
  'adv-treasure': `
**Heritage Context:** The Lost City of Ubar (The Atlantis of the Sands).
**Planner Beats:**
1. **Setup:** {child_name} finds an old map hidden in a schoolbook.
2. **Catalyst:** The map only shows the way when held up to the sunlight.
3. **Escalation:** Following clues through a canyon of red rocks (like Petra/Al-Ula).
4. **Shift:** The "treasure" is a library of ancient scrolls; realizing knowledge is gold.
5. **Resolution:** Sharing the "treasure" with the world, becoming a young explorer.
**Visual Style:** Red sandstone textures, ancient carvings, dusty sunbeams.
`,
  'adv-dino': `
**Heritage Context:** Prehistoric Arabia (When the desert was a jungle).
**Planner Beats:**
1. **Setup:** Visiting a museum and touching a fossilized tooth.
2. **Catalyst:** {child_name} is transported to a world of giant ferns and massive rivers.
3. **Escalation:** Befriending a long-necked dinosaur who helps reach high fruit.
4. **Shift:** Helping a baby dino find its herd during a tropical rain.
5. **Resolution:** Returning to the museum, but now the fossils "speak" to {child_name}.
**Visual Style:** Deep jungle greens, massive scale contrasts, prehistoric mist.
`,
  'adv-space': `
**Heritage Context:** The Hope Probe & The Mars Mission.
**Planner Beats:**
1. **Setup:** Looking through a telescope from a rooftop in the city.
2. **Catalyst:** A shooting star lands in the backyard—it's a small explorer bot!
3. **Escalation:** Building a rocket from cardboard that actually ignites with "Imagination Fuel."
4. **Shift:** Looking back at Earth; realizing how precious and small our home is.
5. **Resolution:** Planting a flag of peace on a red planet, then home for dinner.
**Visual Style:** Cosmic purples, high-tech suits, the blue marble of Earth.
`,
  'adv-ghibli': `
**Heritage Context:** The Khareef Season in Salalah (Green Mountains).
**Planner Beats:**
1. **Setup:** Walking through a misty, emerald-green mountain path.
2. **Catalyst:** The mist takes the shape of a giant, gentle Cloud-Whale.
3. **Escalation:** Floating through the forest, meeting spirits of the Frankincense trees.
4. **Shift:** Rescuing a trapped bird; the forest responds with a symphony of rain.
5. **Resolution:** The sun breaks through the clouds; the green world is more vivid than ever.
**Visual Style:** Lush watercolor greens, soft edges, nostalgic whimsical mood.
`,
  'adv-pixar': `
**Heritage Context:** NEOM & The Cities of the Future.
**Planner Beats:**
1. **Setup:** {child_name} lives in a city with floating taxis and robot cleaners.
2. **Catalyst:** The robots stop working! Only {child_name} knows how to use "Old World" logic.
3. **Escalation:** Using a simple magnet and string to solve a high-tech glitch.
4. **Shift:** Realizing that even in the future, the human heart and hands are most important.
5. **Resolution:** The city lights up again; {child_name} is the Chief Engineer.
**Visual Style:** Neon glow, sleek surfaces, dynamic action compositions.
`,
  'adv-cinematic-realism': `
**Heritage Context:** The Rock Tombs of Hegra (Al-Ula).
**Planner Beats:**
1. **Setup:** A quiet afternoon exploring the towering rocks of the desert.
2. **Catalyst:** The stars align with a carving on a tomb; a secret path appears.
3. **Escalation:** Navigating a gallery of stars inside the rock.
4. **Shift:** Facing the "Guardian of Time"; proving worth through a kind gesture.
5. **Resolution:** The rock closes; {child_name} leaves with a star-crystal and a sense of awe.
**Visual Style:** Dramatic lighting (Chiaroscuro), ultra-detailed rock, cinematic scope.
`,
};

export function getGuidelineForTheme(storyData: StoryData): string {
  const themeId = storyData.themeId || '';
  const guidelineTemplate = guidelines[themeId] || `
**Theme:** A custom story about "${storyData.theme}"
*   **Narrative Design:** Ensure {child_name} is the architect of their own success.
*   **Setting:** Root the story in a setting that best matches the theme. If the theme implies local culture/heritage, use authentic architectural details (arches, courtyards). Otherwise, use standard genre visuals.
*   **Planner Logic:**
    - Pages 1-2: Setup in a familiar, warm environment.
    - Page 3: The Call to Adventure/Discovery.
    - Pages 4-5: The Imaginative Peak (The Challenge).
    - Page 6: The Moment of Realization/Growth.
    - Pages 7-8: The Heroic Return/Satisfaction.
*   **Visual Tribute:** Use rich textures and "Safe Wonder" lighting.
`;

  // EXTRA HARDENING: If we have a themeId, prepend a strict SETTING LOCK instruction.
  let contextLock = "";
  if (themeId) {
    const parts = themeId.split('-');
    const category = parts[0];
    const name = parts[1];
    contextLock = `STRICT SETTING LOCK: This is a ${category} story specifically about ${name}. Do NOT use generic 'backyards' or 'gardens' unless that is the Heritage Context below.\n`;
  }

  return contextLock + guidelineTemplate
    .replace(/{child_name}/g, storyData.childName)
    .replace(/{child_age}/g, storyData.childAge);
}

export function getGuidelineComponentsForTheme(themeId: string): { goal: string; challenge: string; illustrationNotes: string } | null {
  const guideline = guidelines[themeId];
  if (!guideline) return null;

  // Helper to find content after specific sections
  const getSection = (name: string) => {
    const regex = new RegExp(`\\*\\*${name}:\\*\\* (.*)`);
    const match = guideline.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    goal: getSection('Heritage Context'),
    challenge: "Discovering the magic within our culture and values.",
    illustrationNotes: getSection('Visual Style')
  };
}
