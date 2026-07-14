import type { Person } from './types';

// Turns the flat people list into a positioned tree, rooted at "You".
// A person hangs under whoever introduced them (referredById); everyone else
// hangs directly under You. Layout is a tidy top-down tree (Reingold–Tilford
// lite): leaves are placed left-to-right, parents centre over their children.

export const ROOT_ID = '__you__';

export interface TreeNode {
  id: string;
  person?: Person; // undefined only for the You root
  name: string;
  depth: number; // 0 = You, 1 = direct contact, 2 = introduced by a contact…
  x: number; // centre x, in px
  y: number; // centre y, in px
  parentId?: string;
  childrenIds: string[];
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: { from: string; to: string }[];
  byId: Record<string, TreeNode>;
  width: number;
  height: number;
  maxDepth: number;
  colW: number;
  levelH: number;
}

export interface LayoutOpts {
  colW?: number;
  levelH?: number;
}

/**
 * Resolve the parent a person should hang under. Falls back to the You root if
 * the referral is missing/dangling or would create a cycle, so the result is
 * always a proper forest with every person reachable from the root.
 */
function effectiveParent(p: Person, byId: Map<string, Person>): string {
  if (!p.referredById || !byId.has(p.referredById)) return ROOT_ID;
  const seen = new Set<string>([p.id]);
  let cur: string | undefined = p.referredById;
  let steps = 0;
  while (cur) {
    if (seen.has(cur)) return ROOT_ID; // cycle detected
    seen.add(cur);
    cur = byId.get(cur)?.referredById;
    if (++steps > byId.size + 1) return ROOT_ID;
  }
  return p.referredById;
}

export function buildNetworkTree(people: Person[], opts: LayoutOpts = {}): TreeLayout {
  const colW = opts.colW ?? 92;
  const levelH = opts.levelH ?? 118;

  const byIdPerson = new Map(people.map((p) => [p.id, p]));
  const byParent = new Map<string, Person[]>();
  for (const p of people) {
    const parent = effectiveParent(p, byIdPerson);
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(p);
  }
  for (const arr of byParent.values())
    arr.sort((a, b) => a.name.localeCompare(b.name));

  const nodes: TreeNode[] = [];
  const byId: Record<string, TreeNode> = {};
  let nextCol = 0;

  const place = (
    id: string,
    person: Person | undefined,
    depth: number,
    parentId?: string
  ): TreeNode => {
    const kids = byParent.get(id) ?? [];
    const node: TreeNode = {
      id,
      person,
      name: person ? person.name : 'You',
      depth,
      x: 0,
      y: depth * levelH,
      parentId,
      childrenIds: kids.map((k) => k.id),
    };
    if (kids.length === 0) {
      node.x = nextCol * colW;
      nextCol++;
    } else {
      const placed = kids.map((k) => place(k.id, k, depth + 1, id));
      node.x = (placed[0].x + placed[placed.length - 1].x) / 2;
    }
    nodes.push(node);
    byId[id] = node;
    return node;
  };

  place(ROOT_ID, undefined, 0);

  const maxCol = Math.max(0, nextCol - 1);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const edges = nodes
    .filter((n) => n.parentId)
    .map((n) => ({ from: n.parentId!, to: n.id }));

  return {
    nodes,
    edges,
    byId,
    width: (maxCol + 1) * colW,
    height: (maxDepth + 1) * levelH,
    maxDepth,
    colW,
    levelH,
  };
}

/** All node ids strictly below `id` (its referral sub-network). */
export function descendantsOf(byId: Record<string, TreeNode>, id: string): Set<string> {
  const out = new Set<string>();
  const stack = [...(byId[id]?.childrenIds ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    stack.push(...(byId[cur]?.childrenIds ?? []));
  }
  return out;
}

/** The chain of ancestors from `id` up to (and including) the root. */
export function ancestorsOf(byId: Record<string, TreeNode>, id: string): Set<string> {
  const out = new Set<string>();
  let cur = byId[id]?.parentId;
  while (cur) {
    out.add(cur);
    cur = byId[cur]?.parentId;
  }
  return out;
}

/**
 * People who cannot be chosen as X's referrer without creating a cycle:
 * X itself and everyone already in X's sub-network. Used by the form's picker.
 */
export function invalidReferrers(people: Person[], personId: string): Set<string> {
  const layout = buildNetworkTree(people);
  const bad = descendantsOf(layout.byId, personId);
  bad.add(personId);
  return bad;
}
