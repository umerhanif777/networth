import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors, font, radius, space, avatarColorFor, initials } from '../theme';
import { Button, EmptyState } from '../ui';
import {
  buildNetworkTree,
  descendantsOf,
  ancestorsOf,
  ROOT_ID,
  type TreeNode,
} from '../network';

const NODE = 56; // avatar diameter
const NODE_BOX = 88; // node container width (avatar + label)
const PAD_X = 48;
const PAD_TOP = 20;
const LABEL_H = 34;

export function NetworkScreen({ onOpenPerson }: { onOpenPerson: (id: string) => void }) {
  const { people } = useStore();
  const [focus, setFocus] = useState<string | null>(null);

  const layout = useMemo(() => buildNetworkTree(people), [people]);

  // Focus mode: highlight the selected node, its sub-network and its path to You.
  const { highlight, dim } = useMemo(() => {
    if (!focus || !layout.byId[focus]) return { highlight: null as Set<string> | null, dim: false };
    const set = descendantsOf(layout.byId, focus);
    ancestorsOf(layout.byId, focus).forEach((id) => set.add(id));
    set.add(focus);
    return { highlight: set, dim: true };
  }, [focus, layout]);

  const canvasW = layout.width + PAD_X * 2 + NODE;
  const canvasH = layout.height + PAD_TOP + LABEL_H;

  // Convert a node's centre (layout space) to top-left px in canvas space.
  const cx = (n: TreeNode) => n.x + PAD_X + NODE / 2;
  const cy = (n: TreeNode) => n.y + PAD_TOP + NODE / 2;

  const focusNode = focus ? layout.byId[focus] : null;
  const focusPerson = focusNode?.person;
  const focusReach = focus ? descendantsOf(layout.byId, focus).size : 0;

  const directCount = layout.byId[ROOT_ID]?.childrenIds.length ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.h1}>Your network</Text>
        <Text style={styles.sub}>
          {people.length === 0
            ? 'Add people to see your network grow.'
            : `${people.length} ${people.length === 1 ? 'person' : 'people'} · ${directCount} direct · ${layout.maxDepth} ${layout.maxDepth === 1 ? 'level' : 'levels'} deep`}
        </Text>
        <Text style={styles.hint}>Tap anyone to see who they connect you to.</Text>
      </View>

      {people.length === 0 ? (
        <EmptyState
          title="No network yet"
          subtitle="Add people and note who introduced them. Their referral chains draw themselves into a tree here."
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ minWidth: '100%' }}
          >
            <Pressable onPress={() => setFocus(null)}>
              <View style={{ width: canvasW, height: canvasH }}>
                {/* Edges */}
                <Svg
                  width={canvasW}
                  height={canvasH}
                  style={StyleSheet.absoluteFill as any}
                >
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

                {/* Nodes */}
                {layout.nodes.map((n) => {
                  const isRoot = n.id === ROOT_ID;
                  const faded = dim && highlight ? !highlight.has(n.id) : false;
                  const selected = focus === n.id;
                  return (
                    <NodeView
                      key={n.id}
                      node={n}
                      left={cx(n) - NODE_BOX / 2}
                      top={cy(n) - NODE / 2}
                      isRoot={isRoot}
                      faded={faded}
                      selected={selected}
                      onPress={() => (isRoot ? setFocus(null) : setFocus(n.id))}
                    />
                  );
                })}
              </View>
            </Pressable>
          </ScrollView>
          <View style={{ height: focusPerson ? 140 : space.xxl }} />
        </ScrollView>
      )}

      {/* Focus card */}
      {focusPerson && (
        <View style={styles.focusCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.focusName}>{focusPerson.name}</Text>
            <Text style={styles.focusMeta}>
              {focusReach > 0
                ? `Connects you to ${focusReach} more ${focusReach === 1 ? 'person' : 'people'}`
                : 'No onward connections noted yet'}
              {focusPerson.skills.length ? ` · ${focusPerson.skills.slice(0, 3).join(', ')}` : ''}
            </Text>
          </View>
          <Button
            title="Open"
            variant="secondary"
            onPress={() => onOpenPerson(focusPerson.id)}
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
  isRoot,
  faded,
  selected,
  onPress,
}: {
  node: TreeNode;
  left: number;
  top: number;
  isRoot: boolean;
  faded: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const c = isRoot ? { bg: colors.accent, fg: '#fff' } : avatarColorFor(node.name);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.node, { left, top, opacity: faded ? 0.3 : 1 }]}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: c.bg },
          selected && styles.avatarSelected,
        ]}
      >
        {isRoot ? (
          <Ionicons name="person" size={24} color="#fff" />
        ) : (
          <Text style={{ color: c.fg, fontWeight: '700', fontSize: 18 }}>
            {initials(node.name)}
          </Text>
        )}
      </View>
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
  hint: { fontSize: font.small, color: colors.textMuted, marginTop: space.xs },
  node: {
    position: 'absolute',
    width: NODE_BOX,
    alignItems: 'center',
  },
  avatar: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  avatarSelected: { borderColor: colors.accent },
  nodeLabel: {
    marginTop: 5,
    fontSize: font.small,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: 88,
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
