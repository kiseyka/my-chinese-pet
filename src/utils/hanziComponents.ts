// src/utils/hanziComponents.ts
//
// Делит иероглиф на верхнеуровневые компоненты (например, 好 → 女 + 子)
// по данным Make Me a Hanzi: строка разбиения (IDS) и соответствие черт компонентам.

export interface HanziComponent {
  /** Как компонент выглядит в тексте (для подписи), например «女». */
  label: string;
  /** Индексы черт иероглифа, которые относятся к этому компоненту, по порядку. */
  strokeIndices: number[];
}

// Символы описания состава: ⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻ — два элемента, ⿲⿳ — три
const BINARY = new Set(Array.from("⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻"));
const TERNARY = new Set(Array.from("⿲⿳"));

interface IdsNode {
  text: string;
  children: IdsNode[];
}

function parseIds(
  chars: string[],
  pos: number,
): { node: IdsNode; next: number } | null {
  const char = chars[pos];
  if (char === undefined) return null;

  const arity = BINARY.has(char) ? 2 : TERNARY.has(char) ? 3 : 0;

  if (arity === 0) {
    return { node: { text: char, children: [] }, next: pos + 1 };
  }

  const children: IdsNode[] = [];
  let next = pos + 1;

  for (let i = 0; i < arity; i++) {
    const parsed = parseIds(chars, next);
    if (!parsed) return null;
    children.push(parsed.node);
    next = parsed.next;
  }

  return {
    node: { text: children.map((c) => c.text).join(""), children },
    next,
  };
}

/**
 * Возвращает компоненты иероглифа или null, если на части он не делится
 * (или данные неполные/неудобные для тренировки).
 */
export function getComponents(
  decomposition: string | undefined,
  matches: (number[] | null)[] | undefined,
): HanziComponent[] | null {
  if (!decomposition || !matches || matches.length === 0) return null;

  const parsed = parseIds(Array.from(decomposition), 0);
  if (!parsed || parsed.node.children.length < 2) return null;

  const top = parsed.node.children;

  // Каждая черта должна принадлежать какому-то компоненту
  const owners: number[] = [];
  for (const match of matches) {
    if (!match || match.length === 0) return null;
    owners.push(match[0]);
  }

  // Черты компонентов должны идти подряд: сначала все черты первого, потом второго и т.д.
  for (let i = 1; i < owners.length; i++) {
    if (owners[i] < owners[i - 1]) return null;
  }

  const components: HanziComponent[] = [];

  top.forEach((child, index) => {
    const strokeIndices = owners
      .map((owner, strokeIndex) => (owner === index ? strokeIndex : -1))
      .filter((strokeIndex) => strokeIndex >= 0);

    if (strokeIndices.length > 0) {
      components.push({ label: child.text, strokeIndices });
    }
  });

  return components.length >= 2 ? components : null;
}
