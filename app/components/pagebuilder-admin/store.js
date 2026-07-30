import {create} from 'zustand';
import {createNode} from './elementDefs';

const MAX_HISTORY = 50;

function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

/** Recursively finds a node + its parent children array + index within it. */
function locate(tree, id, parentChildren = null) {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.id === id) return {node, siblings: parentChildren || tree, index: i};
    if (node.children?.length) {
      const found = locate(node.children, id, node.children);
      if (found) return found;
    }
  }
  return null;
}

function findNode(tree, id) {
  return locate(tree, id)?.node || null;
}

export const useBuilderStore = create((set, get) => ({
  handle: null,
  seo: {title: '', description: ''},
  tree: [],
  selectedId: null,
  device: 'desktop', // 'desktop' | 'tablet' | 'mobile'
  history: [],
  future: [],
  dirty: false,
  saving: false,
  lastSavedAt: null,

  loadPage: (handle, tree, seo) =>
    set({
      handle,
      tree: tree || [],
      seo: seo || {title: '', description: ''},
      selectedId: null,
      history: [],
      future: [],
      dirty: false,
    }),

  setSeo: (seo) => set({seo, dirty: true}),

  select: (id) => set({selectedId: id}),
  setDevice: (device) => set({device}),

  _pushHistory: () => {
    const {tree, history} = get();
    const next = [...history, cloneTree(tree)];
    if (next.length > MAX_HISTORY) next.shift();
    set({history: next, future: []});
  },

  undo: () =>
    set((state) => {
      if (!state.history.length) return state;
      const previous = state.history[state.history.length - 1];
      return {
        tree: previous,
        history: state.history.slice(0, -1),
        future: [cloneTree(state.tree), ...state.future].slice(0, MAX_HISTORY),
        dirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        tree: next,
        future: rest,
        history: [...state.history, cloneTree(state.tree)].slice(-MAX_HISTORY),
        dirty: true,
      };
    }),

  addSection: () => {
    get()._pushHistory();
    set((state) => ({tree: [...state.tree, createNode('Section')], dirty: true}));
  },

  addColumn: (sectionId) => {
    get()._pushHistory();
    set((state) => {
      const tree = cloneTree(state.tree);
      const section = findNode(tree, sectionId);
      if (section) section.children.push(createNode('Column'));
      return {tree, dirty: true};
    });
  },

  addElement: (columnId, type) => {
    get()._pushHistory();
    set((state) => {
      const tree = cloneTree(state.tree);
      const column = findNode(tree, columnId);
      if (column) column.children.push(createNode(type));
      return {tree, dirty: true};
    });
  },

  removeNode: (id) => {
    get()._pushHistory();
    set((state) => {
      const tree = cloneTree(state.tree);
      const found = locate(tree, id);
      if (found) found.siblings.splice(found.index, 1);
      return {
        tree,
        dirty: true,
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    });
  },

  duplicateNode: (id) => {
    get()._pushHistory();
    set((state) => {
      const tree = cloneTree(state.tree);
      const found = locate(tree, id);
      if (!found) return {tree};
      const copy = JSON.parse(JSON.stringify(found.node));
      assignFreshIds(copy);
      found.siblings.splice(found.index + 1, 0, copy);
      return {tree, dirty: true};
    });
  },

  /**
   * Reorders within a single container (root sections list, a section's
   * columns, or a column's elements) - v1 doesn't support dragging an
   * existing node into a *different* container, only reordering it among
   * its current siblings.
   */
  moveNode: (containerType, containerId, oldIndex, newIndex) => {
    get()._pushHistory();
    set((state) => {
      const tree = cloneTree(state.tree);
      const children = getContainerChildren(tree, containerType, containerId);
      if (!children || oldIndex === newIndex) return {tree};
      const [moved] = children.splice(oldIndex, 1);
      children.splice(newIndex, 0, moved);
      return {tree, dirty: true};
    });
  },

  updateNodeProps: (id, patch) => {
    set((state) => {
      const tree = cloneTree(state.tree);
      const node = findNode(tree, id);
      if (node) Object.assign(node.props, patch);
      return {tree, dirty: true};
    });
  },

  updateNodeStyle: (id, patch) => {
    set((state) => {
      const tree = cloneTree(state.tree);
      const node = findNode(tree, id);
      if (node) Object.assign(node.style, patch);
      return {tree, dirty: true};
    });
  },

  updateNodeVisibility: (id, patch) => {
    set((state) => {
      const tree = cloneTree(state.tree);
      const node = findNode(tree, id);
      if (node) Object.assign(node.visibility, patch);
      return {tree, dirty: true};
    });
  },

  markSaved: () => set({dirty: false, saving: false, lastSavedAt: new Date()}),
  setSaving: (saving) => set({saving}),

  importTree: (tree) => {
    get()._pushHistory();
    set({tree, dirty: true});
  },
}));

function assignFreshIds(node) {
  node.id = crypto.randomUUID();
  node.children?.forEach(assignFreshIds);
}

/** containerType: 'root' | 'columns' | 'elements'. containerId is the
 * owning Section/Column id, or null for 'root'. */
export function getContainerChildren(tree, containerType, containerId) {
  if (containerType === 'root') return tree;
  const owner = findNode(tree, containerId);
  return owner?.children || null;
}

export {findNode};
