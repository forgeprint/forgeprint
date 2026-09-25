# List rendering

Lists are where a React Native app spends its frames. Every row below is about
one thing: rows are created once and reused, not created again on every render
or every scroll.

| #    | Check                                                                                        | How                                                                  | Source                                      |
| ---- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| LR1  | No `ScrollView` rendering `.map()` over data that can grow                                   | `grep -rn -A8 "<ScrollView" app src components \| grep "\.map("`     | RN 0.87 — Optimizing FlatList configuration |
| LR2  | Every `FlatList`, `SectionList` and FlashList has a `keyExtractor` returning a stable id     | read each list; `grep -rn "keyExtractor" …` and look for `index`     | RN 0.87 — Optimizing FlatList; FlashList 2  |
| LR3  | `renderItem` is a stable reference, not an inline arrow recreated each render                | `grep -rnE "renderItem=\{\s*\(" app src components`                  | RN 0.87 — Optimizing FlatList configuration |
| LR4  | Row components are memoised and receive primitives or stable objects                         | read the row component for `memo(`                                   | RN 0.87 — Optimizing FlatList configuration |
| LR5  | A `FlatList` with fixed-height rows provides `getItemLayout`                                 | read the list and the row's style                                    | RN 0.87 — Optimizing FlatList configuration |
| LR6  | FlashList 2: no `estimatedItemSize`, `estimatedListSize` or `estimatedFirstItemOffset`       | `grep -rnE "estimated(ItemSize\|ListSize\|FirstItemOffset)" app src` | FlashList 2 — what's new in v2              |
| LR7  | FlashList 2: no explicit `key` prop inside the `renderItem` tree                             | read each FlashList row component for `key=`                         | FlashList 2 — usage                         |
| LR8  | FlashList 2: `getItemType` is set when rows differ in shape, and it is a cheap lookup        | read the list                                                        | FlashList 2 — usage                         |
| LR9  | FlashList 2: row-local state uses `useRecyclingState` keyed on the item, not bare `useState` | `grep -rn "useState" <row components>`; each hit justified           | FlashList 2 — usage                         |
| LR10 | Images in rows are thumbnails sized for the row, not full-resolution originals               | read the image URLs or the resize step                               | RN 0.87 — Optimizing FlatList configuration |

## Why each one

**LR1** is the most common list defect an agent writes, because it works with
the ten items in a fixture. A `ScrollView` mounts every child immediately; at a
thousand rows, first render and memory grow with the data.

**LR7 and LR9** are FlashList-specific and silent. FlashList reuses a row's
component for a different item. A `key` inside the row forces a remount and
throws recycling away; bare `useState` carries the previous item's state into
the next one — a checked box that belongs to somebody else's row.

**LR2** with the index as key means that inserting at the top shifts every key,
and every row re-renders with the wrong identity.
