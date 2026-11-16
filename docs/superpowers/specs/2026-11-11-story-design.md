# The Road to Corbett: save-the-date story design

Status: **draft for approval** (storyboard v3: https://claude.ai/artifact/NhVG8sf2H9B5bBSz3naQCr). No art gets generated until this is signed off and the inputs at the bottom are in. The venue, The Hridayesh Spa Wilderness Resorts, is painted from its website photos but **never named on the site**.

## Rules that keep it one story
- **One painted world.** Every scene uses the hero's style: Pahari miniature gouache on handmade paper, torn deckled edges, gold-foil accents, a pastel palette of blush, peach, powder blue, dusty lilac, sage, marigold and antique gold. No flat colour sections, no velvet blocks, no brass props (the lantern is retired).
- **One card.** All text sits on the same ivory paper card with a double gold border, in Cormorant Garamond with Cinzel caps.
- **One guide.** The hornbill is a constant feature: it flies with the scroll, perches on a motif in each scene, faces forward (left) when scrolling down and turns back when scrolling up.
- **One clock.** Dawn, then morning, golden hour and dusk. **The story ends at dusk, never night.**
- **Flowers everywhere.** A flower border in every scene, a hanging flower curtain at the venue, marigold petals for the RSVP.
- **Wildlife as recurring characters.** The tiger at the gate, the hornbill guide throughout, the kingfisher pair at the river.

## Structure
One pinned, scroll-scrubbed stage carries scenes 1–4, so there are no cuts. The RSVP form sits at the end of the dusk scene on the same painting, unpinned, so the keyboard and inputs behave normally. A small floating RSVP button stays reachable from the first screen.

| # | Scene | Light | Scroll | Card | Hornbill perch |
|---|-------|-------|--------|------|----------------|
| 1 | Dawn at the forest gate | dawn | 0–100% (built) | Save the date · Shreya & Akshay | tip of the arch |
| 2 | The journey | morning | 100–220% | Blessings · "We, Shreya & Akshay, are getting married" · both families | the jeep's garlanded bonnet |
| 3 | Arrival at the venue | golden hour | 220–340% | 16 & 17 February 2027 · Jim Corbett, Uttarakhand · Add to Calendar | the floral arch on the lawn |
| 4 | Dusk in the garden | dusk | 340–420%, then the RSVP | Kindly respond by … · RSVP · thank-you | the top corner of the RSVP card |

## The hornbill guide (proven in the storyboard, no new art)
- `public/hornbill/` holds the existing sticker cut into `wing-back`, `body` and `wing-front`. The wings flap from the shoulders (pivots at 46.9% 43.9% and 50.8% 50.8% of the sprite) at about 3 beats a second while it moves.
- In the site, each scene's timeline segment has a perch point. Between scenes the bird tweens along a gentle arc to the next perch. ScrollTrigger's `direction` sets its facing: down means forward and left, up means it turns and flies back.
- When it arrives it lands: the wings fold, using a **perched-hornbill image (F)** in the final build so the landing pose is exact. Reduced motion: it simply appears at each perch.

## Scenes

### 1 · Dawn at the forest gate (built, keep)
Layers: sky, hills, forest, fireflies, grass with the tiger, velvet arch. The pop-up intro, then the camera walks through the arch. The hornbill starts perched on the arch tip and takes off when scrolling begins. **Change:** the date card moves to scene 3.

### 2 · The journey
- **Layers:** the forest-trail painting (A), the jeep with the couple (B), the flower border (D), the hornbill.
- The hero's forest crossfades into the trail while the camera keeps pushing. The jeep drives in from the right (wheel bounce, dust puff), eases to a stop, and the couple tilt toward each other. The hornbill lands on the bonnet garland. The card rises. Then the hornbill takes off and the jeep follows it out to the left. The flower border moves faster than the trail.

### 3 · Arrival at the venue
- **Layers:** the venue painting (C), a river shimmer (CSS gold-glint sweep), the flower curtain (E), the flower border (D), the kingfisher pair, the hornbill.
- **Venue as painted (from the Hridayesh photos):** white two-storey colonial-style villas with arched verandas and balustraded balconies among big mango and lychee trees; a lush green wedding lawn under old shade trees with a floral arch and marigold strings; a clear Himalayan river with smooth boulders flowing beside the lawn (the website has few river photos, so the river is painted from description); the forested Shivalik hills behind.
- The camera follows the jeep round the bend and the venue slides in. The flower curtain drops like a toran and sways once. Glints run along the river. The kingfishers sit on a branch over the water, bob, and turn to each other. The hornbill settles on the floral arch.

### 4 · Dusk in the garden, then the RSVP
- **Layers:** the same venue painting with a dusk grade (CSS gradient and filter toward lavender and peach; no new art), diya glows along the garden path, a few fireflies, the flower curtain, the kingfishers, the hornbill.
- The light warms to dusk, diyas light one by one, and the RSVP card rises. The hornbill perches on its top corner.
- **RSVP:** name · Joyfully accept / Regretfully decline · guests stepper (on accept) · phone (optional) · email (optional) · Send.
- **On accept:** marigold petals fall (from D) and the diyas brighten. *We can't wait to celebrate with you.* On decline: *You'll be missed. Thank you for letting us know.* It closes on the S & A monogram in the dusk light.

## Update (inputs received)
- Families card: "Together with our families · We, Shreya & Akshay, are getting married · Shreya, daughter of Dr. Anju Garg & Dr. Rakesh Garg · Akshay, son of Mrs. Mamta Jain & Mr. Amit Jain". There's no grandparents' line unless names are sent. RSVP by **24 November 2026**. No Ganesha. Forest-green jeep. The childhood-photo idea is dropped.
- More wildlife: chital deer on the trail, a peacock on the venue lawn, parakeets flying home at dusk. More flowers: sprays on every card's corners plus a flower kit.
- **The final prompts are in `docs/art-prompts.md`: 7 images (A, B, C, D, E, G wildlife sheet, H flower sheet). The perched hornbill (F) is folded into the wildlife sheet.**
- Likeness: Figma's generator takes text only, so B is painted from a written description of the photos. It will resemble you two, not be an exact portrait.

## Art to generate (superseded by `docs/art-prompts.md`)
All cut-outs on flat magenta `#FF00FF`, full scenes at 1152×2048 portrait, keyed with `scripts/key-magenta.mjs`. Every prompt ends with the shared style line.

| # | Asset | Waits for |
|---|-------|-----------|
| A | Forest trail, morning, empty trail across the lower middle | — |
| B | Garlanded open safari jeep, side view facing left, groom driving, bride beside | couple photos |
| C | Hridayesh at golden hour, as described above | — (river photos welcome) |
| D | Flower border, bottom 25%, plus loose marigold and rose petals | — |
| E | Hanging flower curtain, top 28% | — |
| F | Perched great hornbill, sticker style matching the flying one, side view facing left | — |

Free reuse: the whole hero, the hornbill pieces, the **kingfisher pair** (`public/art/kingfishers.webp`, cut from the sample sticker sheet; it's 280 px wide, so regenerate it larger only if it looks soft) and the gold divider. Retired: `lantern.webp`, `velvet.webp`, `sprig.webp`.

## Inputs needed before generating
1. ~~Venue photos~~ (taken from the website). Your own river photos would help.
2. 2–3 photos of Shreya & Akshay together.
3. Grandparents' and parents' names.
4. Decisions: Ganesha blessing at the start (yes/no) · childhood-photo touch on the jeep dashboard (yes/no) · jeep colour (sage by default) · phone required or optional · RSVP deadline.
