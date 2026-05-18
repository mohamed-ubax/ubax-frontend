/**
 * Bug Condition Exploration Test — Members Assets Optimization
 *
 * Ce test encode le COMPORTEMENT ATTENDU (apres correctif).
 * Il ECHOUE sur le code non corrige, confirmant que le bug existe.
 * Il PASSERA apres l'implementation du correctif (tache 3).
 *
 * Validates: Requirements 1.1, 1.3, 1.4
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const COMPONENT_TS_PATH = resolve(__dirname, "equipe-page.component.ts");
const COMPONENT_HTML_PATH = resolve(__dirname, "equipe-page.component.html");
const CONSTANTS_TS_PATH = resolve(__dirname, "../../constants/equipe-page.constants.ts");

const FIGMA_ASSET_PREFIX = "https://www.figma.com/api/mcp/asset/";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSource(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

/**
 * Extrait la valeur d'une propriete readonly de la forme :
 *   readonly propName = 'value';
 *   readonly propName =\n    'value';
 */
function extractReadonlyProp(source: string, propName: string): string | null {
  const regex = new RegExp(
    `readonly\\s+${propName}\\s*=\\s*[\\s\\S]*?'([^']+)'`,
  );
  const match = regex.exec(source);
  return match?.[1] ?? null;
}

/**
 * Extrait toutes les URLs du tableau MEMBER_AVATAR_FALLBACKS.
 */
function extractMemberAvatarFallbacks(source: string): string[] {
  const arrayMatch =
    /const MEMBER_AVATAR_FALLBACKS\s*=\s*\[([\s\S]*?)\]\s*as const/.exec(
      source,
    );
  if (!arrayMatch?.[1]) {
    return [];
  }
  const arrayContent = arrayMatch[1];
  const urlMatches = [...arrayContent.matchAll(/'([^']+)'/g)];
  return urlMatches.map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Cas 1 — Proprietes d'assets UI ne doivent PAS pointer vers Figma
// ---------------------------------------------------------------------------

describe("Cas 1 — Proprietes d'assets UI (comportement attendu apres correctif)", () => {
  const source = readSource(COMPONENT_TS_PATH);

  const ASSET_PROPERTIES = [
    "promoBackdropSrc",
    "promoImageSrc",
    "roleSortIconSrc",
    "membersEmptyIllustrationSrc",
    "drawerCloseGlassTextureSrc",
    "paginationArrowLeftSrc",
    "paginationArrowRightSrc",
  ] as const;

  for (const propName of ASSET_PROPERTIES) {
    it(`${propName} ne doit PAS commencer par l'URL Figma externe`, () => {
      const value = extractReadonlyProp(source, propName);
      expect(
        value,
        `La propriete '${propName}' est introuvable dans le composant`,
      ).not.toBeNull();
      expect(
        value!.startsWith(FIGMA_ASSET_PREFIX),
        `BUG DETECTE: ${propName} = '${value}' pointe vers Figma (URL externe non bundlee)`,
      ).toBe(false);
    });

    it(`${propName} doit commencer par '/equipe/'`, () => {
      const value = extractReadonlyProp(source, propName);
      expect(value).not.toBeNull();
      expect(
        value!.startsWith("/equipe/"),
        `${propName} = '${value}' — attendu: commence par '/equipe/'`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Cas 2 — MEMBER_AVATAR_FALLBACKS ne doit PAS contenir d'URLs Figma
// ---------------------------------------------------------------------------

describe("Cas 2 — MEMBER_AVATAR_FALLBACKS (comportement attendu apres correctif)", () => {
  const source = readSource(COMPONENT_TS_PATH);

  it("MEMBER_AVATAR_FALLBACKS ne doit contenir aucune URL Figma", () => {
    const fallbacks = extractMemberAvatarFallbacks(source);

    // Sur le code non corrige, le tableau contient 6 URLs Figma -> ce test echoue
    // Apres le correctif, MEMBER_AVATAR_FALLBACKS est remplace par MEMBER_AVATAR_FALLBACK (chemin local)
    const figmaUrls = fallbacks.filter((url) =>
      url.startsWith(FIGMA_ASSET_PREFIX),
    );

    expect(
      figmaUrls,
      `BUG DETECTE: ${figmaUrls.length} URL(s) Figma trouvee(s) dans MEMBER_AVATAR_FALLBACKS:\n${figmaUrls.join("\n")}`,
    ).toHaveLength(0);
  });

  it("le fallback avatar doit etre un chemin local (commence par /equipe/)", () => {
    // Apres le correctif, MEMBER_AVATAR_FALLBACKS est remplace par MEMBER_AVATAR_FALLBACK = '/equipe/avatar-fallback.svg'
    // La constante peut etre definie dans le component ou dans le fichier constants associe
    const constantsSource = readFileSync(CONSTANTS_TS_PATH, "utf-8");
    const fallbackMatch =
      /const MEMBER_AVATAR_FALLBACK\s*=\s*'([^']+)'/.exec(source) ??
      /const MEMBER_AVATAR_FALLBACK\s*=\s*'([^']+)'/.exec(constantsSource);
    expect(
      fallbackMatch,
      "BUG DETECTE: La constante 'MEMBER_AVATAR_FALLBACK' (chemin local) est introuvable — le tableau MEMBER_AVATAR_FALLBACKS avec URLs Figma est encore present",
    ).not.toBeNull();

    const fallbackValue = fallbackMatch![1];
    expect(
      fallbackValue.startsWith("/equipe/"),
      `MEMBER_AVATAR_FALLBACK = '${fallbackValue}' — attendu: commence par '/equipe/'`,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cas 4 — <img class="agency-members-page__member-avatar"> doit avoir loading et decoding
// ---------------------------------------------------------------------------

describe("Cas 4 — Attributs lazy loading sur les img d'avatars (comportement attendu apres correctif)", () => {
  const htmlSource = readSource(COMPONENT_HTML_PATH);

  it('le template HTML doit contenir loading="lazy" sur l\'img avatar', () => {
    // Verification DOM via jsdom — plus precise que la recherche textuelle
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${htmlSource}</body></html>`);
    const img = dom.window.document.querySelector(
      "img.agency-members-page__member-avatar",
    ) as HTMLImageElement | null;
    expect(img, 'La balise img.agency-members-page__member-avatar est introuvable').not.toBeNull();
    expect(
      img!.getAttribute("loading"),
      'BUG DETECTE: L\'attribut loading="lazy" est absent de la balise <img class="agency-members-page__member-avatar">',
    ).toBe("lazy");
  });

  it('le template HTML doit contenir decoding="async" sur l\'img avatar', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${htmlSource}</body></html>`);
    const img = dom.window.document.querySelector(
      "img.agency-members-page__member-avatar",
    ) as HTMLImageElement | null;
    expect(img, 'La balise img.agency-members-page__member-avatar est introuvable').not.toBeNull();
    expect(
      img!.getAttribute("decoding"),
      'BUG DETECTE: L\'attribut decoding="async" est absent de la balise <img class="agency-members-page__member-avatar">',
    ).toBe("async");
  });

  it('la balise img.agency-members-page__member-avatar doit avoir loading="lazy" et decoding="async" (verification DOM)', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${htmlSource}</body></html>`);
    const img = dom.window.document.querySelector(
      "img.agency-members-page__member-avatar",
    ) as HTMLImageElement | null;

    expect(
      img,
      'La balise <img class="agency-members-page__member-avatar"> est introuvable dans le template',
    ).not.toBeNull();

    expect(
      img!.getAttribute("loading"),
      "BUG DETECTE: L'attribut loading est absent ou incorrect sur l'img avatar",
    ).toBe("lazy");

    expect(
      img!.getAttribute("decoding"),
      "BUG DETECTE: L'attribut decoding est absent ou incorrect sur l'img avatar",
    ).toBe("async");
  });
});
