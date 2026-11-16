# v2: the river and the hornbill (change plan)

Status: **for approval.** It combines four parallel reviews (continuity and camera, wildlife/hornbill/jeep, type and RSVP, art production), each checked against the couple's idea: **the two continuous elements are the hornbill and the flowing river; design everything around them.** Nothing gets generated until this is approved.

## What was actually broken (found in code)
- Scenes slid sideways (`xPercent`) and the jeep entered and left through the screen edge, giving the "bumped the edge, then the scene changed" moment.
- Dusk was a second copy of the venue faded over the first. That caused the ghost double peacocks in the screenshot, and dusk read as a flash instead of light changing.
- The hornbill followed the raw scroll position while the scene lagged behind it (`scrub`), so it chased an off-screen jeep (the vanishing) and snapped back in one swipe. Its turn was a one-frame `scaleX` flip.
- The deer faded out mid-frame. Every animal had a white die-cut sticker border and a drop-shadow, so they read as stickers.
- Text sat on big paper cards over the art. Some captions were 9–10 px.
- On desktop the stage sat off-centre during the pin.

## The new shape: one vertical river journey
- **One tall "hanging scroll" world.** The camera only ever moves **down** (or back up). There are no sideways moves anywhere and no duplicated scenes.
- **The river is the spine.** It starts in the opening forest (it already winds down `hero/forest.webp`), flows down the journey painting and ends beside the cottages. Every painting follows a **join rule**: the river leaves the bottom and enters the top at 30–70% of the width. Joins overlap about 10% and sit under mist and rapids bands, so the river never jumps.
- **The hornbill is the companion.** It flies just above the water along the bends, about 35% down the screen and a little ahead of the camera. It lands on **branches that reach in from alternating screen edges over the water** (painted art, already there before it arrives). When you scroll up, the same path plays backwards, it turns edge-on over about half a second like a paper cutout, and it banks into bends. It has landing and take-off poses and a faint reflection on the water when low. Its flight is part of the scroll timeline, so it can't vanish.
- **One light clock.** A single overlay runs over the whole world: morning, then afternoon, golden hour and dusk. The river's reflection carries the colour (pale aqua, then warm white, amber, then lavender and rose), with one sun-glint that lengthens as the sun drops. The camera **holds still at the venue** while the light turns to dusk and diyas appear floating on the water. The story ends at dusk.

## Scene by scene
1. **Opening.** The whole screen is dense forest, with gold-foil **"Save the Date"** in a clearing.
   - On scroll the camera descends through the foliage: the near leaves rush up and out of frame, which is vertical motion only. That reveals the river valley with **Shreya & Akshay** in gold foil and emboss, with no white glow, just above the river's bend.
   - The names' reflection ripples softly in the water; the letters themselves stay sharp. The tiger stays in the grass.
   - The arch frame and the small "Save the date" line are removed.
2. **The journey.**
   - The river winds down the page, with the road on its right bank.
   - The jeep (unchanged art, smaller, about 50% width) drives the road on a drawn path at a steady, slower pace. It tilts slightly with the slope, its wheels turn with scroll, and its bounce and dust follow scroll speed (the dust is re-tinted from pink to sand). At bends it passes behind tree clumps and never touches the screen edge. The camera follows it down.
   - The chital pair is **painted into the riverbank**, drinking, half-hidden in reeds, like the tiger.
   - The families text hangs on a **silk banner from a branch**, stacked one line under another. The hornbill perches on the banner's rod.
3. **Arrival at the venue.**
   - A new painting: **low cottages with sloping terracotta roofs**, stone walls, small verandas and bougainvillea among mango trees, on the right bank. The garden lawn runs down to the fast river over boulders.
   - **No palace, no arches, no garlands, no hanging curtain.** The kingfisher pair and a small peacock are painted in.
   - The dates are on a **carved wooden sign at the lane**. One small "Add to Calendar" tag opens into Google and Apple/Outlook.
4. **Dusk and RSVP.**
   - The camera holds while the light turns to dusk. Two parakeets (no border) fly home over the river.
   - The **hornbill flies down carrying a sealed scroll**, lands on a small hanging board, and the scroll opens into a **compact 3-step RSVP**, one question at a time:
     1. accept or decline;
     2. name, plus guests on accept;
     3. phone and email, both optional, then Send.
   - It uses 56 px tap targets, and the scene stays visible around it.
   - On "yes", marigold petals fall and float down the river. On send, the hornbill flies off with the scroll.

## Type
- Gold-foil text with an emboss for "Save the Date", the names and the dates. It is made in code, with no credits.
- Ivory and gold text on the banner and the board. Nothing below 14 px; caps at least 12 px.
- The fonts stay Cormorant Garamond and Cinzel.

## Wildlife: keep and cut
- **Keep:** the tiger; the chital, kingfishers and a small peacock, all painted into the scenes; two parakeets at dusk; the hornbill.
- **Cut:** the butterflies, and every sticker border.

## New art: 5 images, 7 at most with retries
All follow the river join rule and the same sun direction (low, upper right).

| # | Image | Replaces |
|---|-------|----------|
| 1 | Opening foliage (magenta): dense forest filling the frame with a clearing for "Save the Date" | the arch frame |
| 2 | Journey painting: river down the centre, road on the right bank, chital drinking | trail |
| 3 | Venue painting: river from the top, cottages on the right bank, garden lawn, kingfishers, small peacock, no garlands | venue |
| 4 | Seam sheet (magenta): a misty treetop strip and a rapids-and-boulders strip at the river width | — |
| 5 | Props sheet (magenta, no borders): two overhanging branches (cut at the left and right edges), a palash branch, the perched hornbill with feet only, two parakeets, a blank silk banner with rod and tassels, a blank carved wooden signboard, a sealed scroll with a red silk tie | wild/*, curtain, cards |

**Keep:** the hero sky, hills, forest and grass with the tiger, the flapping hornbill, the jeep, the petals, the lotus and palash. **Retire:** frame, trail, venue, curtain, garland, all wild/* stickers, the card corners.

## Open choices for the couple
- The jeep's **own** marigold garlands stay unless you want them gone. Removing them means regenerating the jeep, which risks the likeness.
- The opening reveal is vertical: you descend through the leaves. Bushes parting sideways would break the up-and-down rule.
