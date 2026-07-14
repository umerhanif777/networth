import type { Person } from './types';

// Turns the flat people list into a positioned tree for the Network screen.
// Two shapes are supported, both rooted at "You":
//   - People tree:    You -> direct contacts -> people they introduced you to.
//   - Expertise tree: You -> each skill -> the people who have that skill.
// Both run through one tidy top-down layout (Reingold–Tilford lite): leaves are
// placed left-to-right, parents centre over their children.

export const ROOT_ID = '__you__';

export type NodeKind = 'root' | 'person' | 'skill';

export interface TreeNode {
  id: string;
  kind: NodeKind;
  name: string; // display label
  person?: Person; // person nodes only
  skill?: string; // skill nodes only
  depth: number; // 0 = You
  x: number; // centre x, px
  y: number; // centre y, px
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

interface RawNode {
  id: string;
  kind: NodeKind;
  name: string;
  person?: Person;
  skill?: string;
  children: string[];
}

function layoutForest(
  raw: Map<string, RawNode>,
  rootId: string,
  colW: number,
  levelH: number
): TreeLayout {
  const nodes: TreeNode[] = [];
  const byId: Record<string, TreeNode> = {};
  let nextCol = 0;

  const place = (id: string, depth: number, parentId?: string): TreeNode => {
    const r = raw.get(id)!;
    const node: TreeNode = {
      id: r.id,
      kind: r.kind,
      name: r.name,
      person: r.person,
      skill: r.skill,
      depth,
      x: 0,
      y: depth * levelH,
      parentId,
      childrenIds: r.children,
    };
    if (r.children.length === 0) {
      node.x = nextCol * colW;
      nextCol++;
    } else {
      const placed = r.children.map((c) => place(c, depth + 1, id));
      node.x = (placed[0].x + placed[placed.length - 1].x) / 2;
    }
    nodes.push(node);
    byId[id] = node;
    return node;
  };

  place(rootId, 0);

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

/**
 * Resolve the parent a person hangs under in the People tree. Falls back to the
 * You root when the referral is missing/dangling or would create a cycle, so the
 * result is always a proper forest with every person reachable from the root.
 */
function effectiveParent(p: Person, byId: Map<string, Person>): string {
  if (!p.referredById || !byId.has(p.referredById)) return ROOT_ID;
  const seen = new Set<string>([p.id]);
  let cur: string | undefined = p.referredById;
  let steps = 0;
  while (cur) {
    if (seen.has(cur)) return ROOT_ID;
    seen.add(cur);
    cur = byId.get(cur)?.referredById;
    if (++steps > byId.size + 1) return ROOT_ID;
  }
  return p.referredById;
}

/** People tree: You -> direct contacts -> people they introduced you to. */
export function buildPeopleTree(people: Person[], opts: LayoutOpts = {}): TreeLayout {
  const colW = opts.colW ?? 92;
  const levelH = opts.levelH ?? 118;

  const byIdPerson = new Map(people.map((p) => [p.id, p]));
  const byParent = new Map<string, Person[]>();
  for (const p of people) {
    const parent = effectiveParent(p, byIdPerson);
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(p);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.name.localeCompare(b.name));

  const raw = new Map<string, RawNode>();
  const build = (id: string, person?: Person) => {
    const kids = byParent.get(id) ?? [];
    for (const k of kids) build(k.id, k);
    raw.set(id, {
      id,
      kind: person ? 'person' : 'root',
      name: person ? person.name : 'You',
      person,
      children: kids.map((k) => k.id),
    });
  };
  build(ROOT_ID);

  return layoutForest(raw, ROOT_ID, colW, levelH);
}

/** Expertise tree: You -> each skill -> the people who have that skill. */
export function buildExpertiseTree(people: Person[], opts: LayoutOpts = {}): TreeLayout {
  const colW = opts.colW ?? 100;
  const levelH = opts.levelH ?? 118;

  const bySkill = new Map<string, Person[]>();
  const noSkill: Person[] = [];
  for (const p of people) {
    const skills = p.skills.map((s) => s.trim()).filter(Boolean);
    if (skills.length === 0) {
      noSkill.push(p);
      continue;
    }
    for (const s of skills) {
      if (!bySkill.has(s)) bySkill.set(s, []);
      bySkill.get(s)!.push(p);
    }
  }

  // Most-covered expertise first, then alphabetical.
  const skillNames = [...bySkill.keys()].sort(
    (a, b) => bySkill.get(b)!.length - bySkill.get(a)!.length || a.localeCompare(b)
  );

  const raw = new Map<string, RawNode>();
  const rootChildren: string[] = [];

  const addSkillNode = (skillId: string, label: string, skill: string, ppl: Person[]) => {
    const childIds = [...ppl]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const pid = `${skillId}::${p.id}`;
        raw.set(pid, { id: pid, kind: 'person', name: p.name, person: p, children: [] });
        return pid;
      });
    raw.set(skillId, { id: skillId, kind: 'skill', name: label, skill, children: childIds });
    rootChildren.push(skillId);
  };

  for (const s of skillNames) addSkillNode(`skill::${s}`, s, s, bySkill.get(s)!);
  if (noSkill.length) addSkillNode('skill::__none__', 'No skills yet', '', noSkill);

  raw.set(ROOT_ID, { id: ROOT_ID, kind: 'root', name: 'You', children: rootChildren });

  return layoutForest(raw, ROOT_ID, colW, levelH);
}

/** All node ids strictly below `id`. */
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
  const layout = buildPeopleTree(people);
  const bad = descendantsOf(layout.byId, personId);
  bad.add(personId);
  return bad;
}
