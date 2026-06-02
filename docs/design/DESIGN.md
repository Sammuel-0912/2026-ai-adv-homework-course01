---
name: Floral Editorial
colors:
  surface: '#ecfeea'
  surface-dim: '#cddfcb'
  surface-bright: '#ecfeea'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f9e4'
  surface-container: '#e1f3df'
  surface-container-high: '#dbedd9'
  surface-container-highest: '#d5e7d4'
  on-surface: '#101f13'
  on-surface-variant: '#544341'
  inverse-surface: '#253427'
  inverse-on-surface: '#e3f6e2'
  outline: '#877270'
  outline-variant: '#dac1bf'
  surface-tint: '#954742'
  primary: '#2a0002'
  on-primary: '#ffffff'
  primary-container: '#4a0e0e'
  on-primary-container: '#cc726d'
  inverse-primary: '#ffb3ad'
  secondary: '#605e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2dd'
  on-secondary-container: '#666460'
  tertiary: '#0f0f0f'
  on-tertiary: '#ffffff'
  tertiary-container: '#242424'
  on-tertiary-container: '#8d8b8b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#3d0506'
  on-primary-fixed-variant: '#77302d'
  secondary-fixed: '#e6e2dd'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#484743'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#ecfeea'
  on-background: '#101f13'
  surface-variant: '#d5e7d4'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 80px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  margin-desktop: 80px
  margin-mobile: 24px
  gutter-desktop: 32px
  gutter-mobile: 16px
  section-padding: 120px
---

## Brand & Style

The design system is anchored in the aesthetic of high-fashion editorial publishing. It balances the organic, ephemeral beauty of floral arrangements with the structured, disciplined world of luxury retail. The visual language evokes a sense of quiet opulence, prioritizing quality over quantity and intentionality over decoration.

The design style is a hybrid of **Minimalism** and **High-Contrast Editorial**. It utilizes generous whitespace—referred to as "breathing room"—to allow high-resolution photography of floral textures to take center stage. Every element is meticulously placed to create a sense of balance, harmony, and timeless sophistication. The emotional response should be one of serenity, prestige, and a tactile appreciation for natural beauty.

## Colors

The palette is rooted in a "Cream and Wine" foundation. The primary color, a deep Burgundy, serves as the signature mark of luxury and passion. It is used for primary actions, key headlines, and brand moments. The secondary color, a rich Cream, provides a warmer, more sophisticated alternative to pure white, acting as the primary canvas for the UI.

Charcoal Black is reserved for body text and structural elements where high legibility is required. A soft, muted Sage Green acts as a tertiary accent, subtly nodding to the botanical nature of the product without competing with the floral photography. 

- **Primary (Burgundy):** High-impact actions and brand-led typography.
- **Secondary (Cream):** Global background and container surfaces.
- **Tertiary (Charcoal):** Standard text and deep iconography.
- **Neutral (Muted Green):** Success states, soft accents, and botanical references.

## Typography

Typography is the cornerstone of this design system's editorial feel. It utilizes a high-contrast pairing that reflects luxury publishing standards.

**Headlines:** Playfair Display is used for its graceful serifs and dramatic stroke contrast. Large display sizes should use tighter letter spacing to create a cohesive visual block. Headlines are the "voice" of the brand—romantic and authoritative.

**Body & UI:** Inter provides a functional, modern counterpoint to the serif headlines. It ensures that transactional information, such as pricing and product descriptions, remains clear and objective.

**Labels:** Small labels and navigational elements use Inter in uppercase with increased letter spacing to create a "gallery-style" labeling effect, enhancing the premium feel.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy for desktop to maintain strict editorial control over composition, transitioning to a fluid model for smaller viewports.

- **Grid:** A 12-column grid is used for desktop (max-width 1440px). For mobile, a 4-column fluid grid is used.
- **Rhythm:** An 8px linear scale governs all spacing.
- **Whitespace:** Generous section padding (120px on desktop) is mandatory to prevent the UI from feeling "crowded." This airy approach ensures that each floral arrangement is viewed as a piece of art rather than just a SKU.
- **Alignment:** Centralized layouts are preferred for landing pages and high-level marketing, while asymmetrical "magazine-style" offsets are encouraged for product storytelling.

## Elevation & Depth

To maintain a sophisticated and flat editorial look, depth is conveyed through **Tonal Layering** rather than heavy shadows.

- **Surface Tiers:** The base layer is always the rich Cream. Secondary surfaces (like cards or menus) can be white for a subtle "lift" or a slightly darker shade of cream to create depth.
- **Shadows:** When necessary, shadows must be "Ambient." Use very low opacity (3-5%) with a large blur radius and a slight warm tint to match the Cream background. Shadows should feel like natural light hitting a physical object, not a digital effect.
- **Outlines:** Use thin, 1px borders in Burgundy or a lightened Charcoal for high-definition elements like input fields and ghost buttons.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding removes the aggressive sharpness of a purely brutalist grid while maintaining the structured elegance of a fashion magazine. 

- **Cards:** Use `rounded-lg` (0.5rem) for product cards and containers to give a gentle, approachable feel to the luxury items.
- **Buttons:** Primary buttons can be either sharp-edged for a more formal look or `rounded-lg` for standard UI interactions.
- **Imagery:** Floral photography should occasionally use "organic masks" (e.g., arch shapes or soft ovals) to contrast against the rigid grid.

## Components

**Buttons:**
- **Primary:** Solid Burgundy with White or Cream text. No shadow. Minimalist and bold.
- **Secondary (Ghost):** 1px Burgundy border with transparent background. Used for less critical actions to keep the interface light.

**Input Fields:**
- Underlined style or thin 1px borders. Labels should be small, uppercase, and placed above the field in Inter. Focus states should be indicated by a weight increase in the border or a shift to Burgundy.

**Cards:**
- Product cards should feature large, high-quality images. The text (product name and price) should be placed either beneath the image in a centered layout or slightly inset with a subtle tonal background. Avoid heavy shadows; use thin borders or tonal shifts to define boundaries.

**Navigation:**
- Minimalist top-tier navigation. Use the Label-md typography style for menu items. The navigation should stay pinned or disappear on scroll to maximize the viewing area for photography.

**Chips/Tags:**
- Used for floral categories (e.g., "Seasonal," "Roses"). These should be pill-shaped with light Sage Green backgrounds and Charcoal text, appearing understated and natural.