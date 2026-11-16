# Final art prompts: one generation pass (7 images)

Generate in Figma file `sHhkMiXFzTYPWYqrutCFKr` (model `gpt-image-2.5-flare`). Full scenes at 1152×2048; sheets at 1536×1536. After download: scenes go through `key-magenta.mjs --opaque`; cut-outs through `key-magenta.mjs`; sheets are keyed, then split into separate stickers by connected components.

**STYLE** (append to every prompt):
> Painted in a refined Indian Pahari miniature gouache style on textured handmade cotton paper, fine gold-foil accents, soft pastel palette of blush, peach, powder blue, dusty lilac, sage, marigold and antique gold, matching a layered paper pop-up diorama. Elegant premium stationery craftsmanship, not cartoonish. No text, no letters, no watermark.

**MAGENTA** (append to cut-outs and sheets):
> Isolated on a perfectly flat, solid, pure magenta background #FF00FF with no ground, shadow, texture or gradient.

---

**A · Forest trail (scene, 1152×2048)**
Vertical scene, Jim Corbett forest at mid-morning. A sandy safari trail runs horizontally across the lower-middle of the image from the left edge to the right edge, bordered by tall sal trees with rounded detailed canopies, ferns and small wildflowers. Behind the trees on the far side, a clear river glints in pale aqua among smooth boulders, with misty Kumaon hills and a soft blush-and-powder-blue sky with light clouds above. The trail is empty: no vehicles, no people, no animals. The upper third is calm sky and canopy. + STYLE

**B · The jeep with Shreya & Akshay (cut-out, 1536×1024)**
Side view of a vintage open-top safari jeep in deep forest green, driving towards the left, decorated for an Indian wedding with marigold and blush-rose garlands along the bonnet and sides and a floral bunch on the grille. Akshay is driving: an Indian man in his early thirties with a round, friendly face, light stubble and a thin moustache, dark hair swept back from a receding hairline, a fuller build and warm medium-brown skin, in an ivory sherwani with a sage stole and a blush safa. Beside him is Shreya: a slim Indian woman with an oval face, defined eyebrows, warm skin and very long, straight black hair falling to her waist, with a gentle closed-lip smile, in a blush-pink lehenga with gold zari and a sheer dupatta flowing back in the wind. They are smiling at each other. A soft puff of dust behind the rear wheels. + STYLE + MAGENTA

**C · The venue at golden hour (scene, 1152×2048)**
Vertical scene of a riverside wedding resort in Jim Corbett at golden hour. A clear Himalayan river flows through the lower middle over smooth grey boulders, with soft ripples and gold-foil glints. On the far bank, white two-storey colonial-style villas with arched verandas, balustraded balconies and flat parapet roofs sit among big mango and lychee trees. On the near bank, a lush green wedding lawn under old spreading shade trees runs right down to the river, prepared for the functions: a floral arch of marigolds and blush roses, strings of marigold garlands between the trees, flower-lined pathways and low cushioned seating, with no people and no lanterns. Forested Shivalik hills and a pastel peach-and-lilac sky above; the upper quarter is calm sky. + STYLE

**D · Flower border + petals (cut-out, 1152×2048)**
Isolated foreground layer: a lush border of flowers rising from the bottom edge across the full width, filling only the bottom 25% of the image: marigolds, blush roses, white jasmine, pink lotus buds, lilac wildflowers and curling ferns, each cluster cut from handmade paper with soft deckled edges. Above them, in the middle of the image, a scatter of about fifteen loose single marigold and rose petals, each separate and not touching anything. + STYLE + MAGENTA

**E · Hanging flower curtain (cut-out, 1152×2048)**
Isolated decorative layer: cascading flowers hanging from the top edge, heaviest at the top-left and top-right corners and thinning towards the centre, filling only the top 28% of the image: strands of marigold garlands, blush roses, white jasmine strings and trailing green leaves. + STYLE + MAGENTA

**G · Wildlife sticker sheet (sheet, 1536×1536)**
A sheet of separate die-cut paper stickers, each with a clean white paper border, evenly spaced with clear gaps so that none touch: (1) a chital (spotted deer) stag with antlers, standing, side view facing left; (2) a chital doe, head raised, side view facing left; (3) an Indian peacock walking with its tail lowered, side view facing left; (4) a great hornbill perched on a short horizontal branch, side view facing left, wings folded, black-and-yellow with a golden casque; (5) a pair of common kingfishers on a short branch; (6) three rose-ringed parakeets in flight in a loose line, facing left; (7) two butterflies, one powder-blue and one marigold. + STYLE + MAGENTA

**H · Flower sticker sheet (sheet, 1536×1536)**
A sheet of separate floral elements, evenly spaced with clear gaps so that none touch: (1) and (2) a mirrored pair of corner sprays of blush roses, jasmine and leaves shaped to fit a card's top-left and top-right corners; (3) a single hanging marigold garland strand; (4) a pair of pink lotus flowers with a lotus leaf; (5) a loose bunch of lilac and white wildflowers; (6) a sprig of flame-of-the-forest (palash) blossoms in soft orange; (7) a curved string of white jasmine buds. + STYLE + MAGENTA

---

### B redo: likeness from real photos
Figma `generate_image` is text-only, so the first B gave Akshay a beard and a stranger's face. Redo it with a tool that takes photos as references:
- **Option 1, Figma Weave** (image-to-image models such as Nano Banana). One-time setup: sign in at app.weavy.ai, then Profile settings → link your Figma account. Then upload the couple photos with the in-chat picker and run it; the cost is quoted before anything runs.
- **Option 2, ChatGPT or Gemini** (done by the couple). Upload 2–3 clear photos (both faces, front-on; Akshay is clean-shaven) plus `docs/art-review/4-jeep-needs-redo.jpg` as the style reference, with this prompt:
  > Repaint this jeep scene keeping exactly the same jeep, garlands, pose, clothes, painting style and flat magenta #FF00FF background, but make the two people look exactly like the couple in my photos: the man is clean-shaven with no beard or stubble, a round face and dark hair swept back from a receding hairline; the woman has an oval face and very long straight black hair. Same Indian Pahari miniature gouache style with gold-foil accents. No text.

**Status (generated 11 Nov 2026):** A, C, D, E, G and H are done and live in `public/story/` (`trail`, `venue`, `border`, `curtain`, `wild/*`, `flowers/*`, `petals/*`). B was regenerated once with Akshay clean-shaven (`B-jeep-v2.png` → `public/story/jeep.webp`). Code retouching was tried and abandoned because it couldn't match the brushwork.

**Free reuse (no credits):** the hero layers, the flapping hornbill pieces, the gold divider, and the kingfisher pair cut earlier (replaced by G5 if the sheet's version matches better).

**Retries:** budget 1–2 for whichever piece misses (most likely B, for likeness).
