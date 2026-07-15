import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors, font, radius, space, avatarColorFor, initials } from '../theme';
import { Button, EmptyState } from '../ui';
import {
  buildPeopleTree,
  buildExpertiseTree,
  descendantsOf,
  ancestorsOf,
  ROOT_ID,
  type TreeNode,
} from '../network';

const NODE = 56; // avatar / node diameter
const NODE_BOX = 92; // node container width (node + label)
const PAD_X = 48;
const PAD_TOP = 20;
const LABEL_H = 34;

type Mode = 'people' | 'expertise';

export function NetworkScreen({ onOpenPerson }: { onOpenPerson: (id: string) => void }) {
  const { people } = useStore();
  const [mode, setMode] = useState<Mode>('people');
  const [focus, setFocus] = useState<string | null>(null);
  const [openSkills, setOpenSkills] = useState<Set<string>>(new Set());

  const layout = useMemo(
    () =>
      mode === 'people'
        ? buildPeopleTree(people)
        : buildExpertiseTree(people, { expanded: openSkills }),
    [people, mode, openSkills]
  );

  const switchMode = (m: Mode) => {
    setMode(m);
    setFocus(null);
    setOpenSkills(new Set());
  };

  const toggleSkill = (id: string) => {
    setFocus(null);
    setOpenSkills((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { highlight, dim } = useMemo(() => {
    if (!focus || !layout.byId[focus]) return { highlight: null as Set<string> | null, dim: false };
    const set = descendantsOf(layout.byId, focus);
    ancestorsOf(layout.byId, focus).forEach((id) => set.add(id));
    set.add(focus);
    return { highlight: set, dim: true };
  }, [focus, layout]);

  const canvasW = layout.width + PAD_X * 2 + NODE;
  const canvasH = layout.height + PAD_TOP + LABEL_H;
  const cx = (n: TreeNode) => n.x + PAD_X + NODE / 2;
  const cy = (n: TreeNode) => n.y + PAD_TOP + NODE / 2;

  const focusNode = focus ? layout.byId[focus] : null;
  const focusReach = focus ? descendantsOf(layout.byId, focus).size : 0;

  const topLevel = layout.byId[ROOT_ID]?.childrenIds.length ?? 0;
  const subtitle =
    people.length === 0
      ? 'Add people to see your network grow.'
      : mode === 'people'
      ? `${people.length} ${people.length === 1 ? 'person' : 'people'} · ${topLevel} direct · ${layout.maxDepth} ${layout.maxDepth === 1 ? 'level' : 'levels'} deep`
      : `${topLevel} ${topLevel === 1 ? 'area' : 'areas'} of expertise · ${people.length} ${people.length === 1 ? 'person' : 'people'}`;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.h1}>Your network</Text>
        <Text style={styles.sub}>{subtitle}</Text>

        <View style={styles.segment}>
          {(['people', 'expertise'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                style={[styles.segItem, active && styles.segItemActive]}
              >
                <Ionicons
                  name={m === 'people' ? 'people-outline' : 'sparkles-outline'}
                  size={15}
                  color={active ? colors.accentText : colors.textSecondary}
                />
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {m === 'people' ? 'People' : 'Expertise'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.hint}>
          {mode === 'people'
            ? 'Tap anyone to see who they connect you to.'
            : 'Tap a skill to reveal everyone who covers it.'}
        </Text>
      </View>

      {people.length === 0 ? (
        <EmptyState
          title="No network yet"
          subtitle="Add people and note their skills and who introduced them. Your network draws itself into a tree here."
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ minWidth: '100%' }}
          >
            <View style={{ width: canvasW, height: canvasH }}>
              {/* Tap empty space to clear focus — a sibling layer behind the
                  nodes, so a node tap doesn't bubble up and clear itself. */}
              <Pressable style={StyleSheet.absoluteFill as any} onPress={() => setFocus(null)} />
              <View style={StyleSheet.absoluteFill as any} pointerEvents="none">
                <Svg width={canvasW} height={canvasH}>
                  {layout.edges.map((e) => {
                    const a = layout.byId[e.from];
                    const b = layout.byId[e.to];
                    const on = !highlight || (highlight.has(e.from) && highlight.has(e.to));
                    const x1 = cx(a);
                    const y1 = cy(a) + NODE / 2;
                    const x2 = cx(b);
                    const y2 = cy(b) - NODE / 2;
                    const my = (y1 + y2) / 2;
                    return (
                      <Path
                        key={`${e.from}-${e.to}`}
                        d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
                        stroke={on ? colors.accent : colors.border}
                        strokeWidth={on ? 2 : 1.5}
                        fill="none"
                        opacity={on ? 0.5 : 0.4}
                      />
                    );
                  })}
                </Svg>
              </View>

              {layout.nodes.map((n) => {
                const faded = dim && highlight ? !highlight.has(n.id) : false;
                return (
                  <NodeView
                    key={n.id}
                    node={n}
                    left={cx(n) - NODE_BOX / 2}
                    top={cy(n) - NODE / 2}
                    faded={faded}
                    selected={focus === n.id}
                    skillOpen={n.kind === 'skill' && openSkills.has(n.id)}
                    onPress={() => {
                      if (n.kind === 'root') setFocus(null);
                      else if (n.kind === 'skill') toggleSkill(n.id);
                      else setFocus(n.id);
                    }}
                  />
                );
              })}
            </View>
          </ScrollView>
          <View style={{ height: focusNode && focusNode.kind !== 'root' ? 140 : space.xxl }} />
        </ScrollView>
      )}

      {focusNode && focusNode.kind === 'person' && focusNode.person && (
        <View style={styles.focusCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.focusName}>{focusNode.person.name}</Text>
            <Text style={styles.focusMeta}>
              {mode === 'people'
                ? focusReach > 0
                  ? `Connects you to ${focusReach} more ${focusReach === 1 ? 'person' : 'people'}`
                  : 'No onward connections noted yet'
                : focusNode.person.skills.length
                ? focusNode.person.skills.join(', ')
                : 'No skills listed'}
            </Text>
          </View>
          <Button
            title="Open"
            variant="secondary"
            onPress={() => onOpenPerson(focusNode.person!.id)}
            icon={<Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />}
          />
        </View>
      )}
    </View>
  );
}

function NodeView({
  node,
  left,
  top,
  faded,
  selected,
  skillOpen,
  onPress,
}: {
  node: TreeNode;
  left: number;
  top: number;
  faded: boolean;
  selected: boolean;
  skillOpen?: boolean;
  onPress: () => void;
}) {
  const isRoot = node.kind === 'root';
  const isSkill = node.kind === 'skill';
  const personColor = avatarColorFor(node.name);

  return (
    <Pressable onPress={onPress} style={[styles.node, { left, top, opacity: faded ? 0.3 : 1 }]}>
      {isSkill ? (
        <View style={[styles.skillNode, skillOpen && styles.skillNodeOpen]}>
          <Ionicons
            name={skillOpen ? 'pricetag' : 'pricetag-outline'}
            size={22}
            color={skillOpen ? '#fff' : colors.accentText}
          />
          {typeof node.count === 'number' && node.count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{node.count}</Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.avatar,
            { backgroundColor: isRoot ? colors.accent : personColor.bg },
            selected && styles.selectedBorder,
          ]}
        >
          {isRoot ? (
            <Ionicons name="person" size={24} color="#fff" />
          ) : (
            <Text style={{ color: personColor.fg, fontWeight: '700', fontSize: 18 }}>
              {initials(node.name)}
            </Text>
          )}
        </View>
      )}
      <Text style={styles.nodeLabel} numberOfLines={1}>
        {node.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  h1: { fontSize: font.h1, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: font.body, color: colors.textSecondary, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
    marginTop: space.md,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  segItemActive: { backgroundColor: colors.surface },
  segText: { fontSize: font.small, color: colors.textSecondary, fontWeight: '500' },
  segTextActive: { color: colors.accentText, fontWeight: '600' },
  hint: { fontSize: font.small, color: colors.textMuted, marginTop: space.sm },
  node: { position: 'absolute', width: NODE_BOX, alignItems: 'center' },
  avatar: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  skillNode: {
    width: NODE,
    height: NODE,
    borderRadius: radius.md,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  skillNodeOpen: { backgroundColor: colors.accent },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: 12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: colors.accentText,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  selectedBorder: { borderColor: colors.accent },
  nodeLabel: {
    marginTop: 5,
    fontSize: font.small,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: NODE_BOX,
    textAlign: 'center',
  },
  focusCard: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  focusName: { fontSize: font.h3, fontWeight: '600', color: colors.textPrimary },
  focusMeta: { fontSize: font.small, color: colors.textSecondary, marginTop: 2 },
});
