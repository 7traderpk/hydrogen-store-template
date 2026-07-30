import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useBuilderStore, getContainerChildren} from './store';
import {ELEMENT_DEFS, CONTENT_TYPES} from './elementDefs';

const DEVICE_WIDTH = {desktop: '100%', tablet: '768px', mobile: '375px'};

export function Canvas() {
  const tree = useBuilderStore((s) => s.tree);
  const device = useBuilderStore((s) => s.device);
  const moveNode = useBuilderStore((s) => s.moveNode);
  const addSection = useBuilderStore((s) => s.addSection);
  const addColumn = useBuilderStore((s) => s.addColumn);
  const addElement = useBuilderStore((s) => s.addElement);

  function handleDragEnd({active, over}) {
    if (!over) return;
    const activeId = String(active.id);

    if (activeId.startsWith('palette-')) {
      const elementType = activeId.slice('palette-'.length);
      const overData = over.data.current;
      if (!overData) return;
      if (overData.containerType === 'root' && elementType === 'Section') {
        addSection();
      } else if (overData.containerType === 'columns' && elementType === 'Column') {
        addColumn(overData.containerId);
      } else if (
        overData.containerType === 'elements' &&
        CONTENT_TYPES.includes(elementType)
      ) {
        addElement(overData.containerId, elementType);
      }
      return;
    }

    if (activeId === String(over.id)) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (
      !activeData ||
      !overData ||
      activeData.containerType !== overData.containerType ||
      activeData.containerId !== overData.containerId
    ) {
      return; // v1: no cross-container drag for existing nodes
    }
    const children = getContainerChildren(tree, activeData.containerType, activeData.containerId);
    if (!children) return;
    const ids = children.map((c) => c.id);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    moveNode(activeData.containerType, activeData.containerId, oldIndex, newIndex);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="builder-body">
        <Palette />
        <div className="canvas-scroll">
          <div className="device-frame" style={{maxWidth: DEVICE_WIDTH[device]}}>
            <RootDropzone tree={tree} />
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function Palette() {
  return (
    <aside className="palette">
      <h3>Layout</h3>
      <PaletteItem type="Section" label="Section" />
      <PaletteItem type="Column" label="Column" />
      <h3>Content</h3>
      {CONTENT_TYPES.map((type) => (
        <PaletteItem key={type} type={type} label={ELEMENT_DEFS[type].label} />
      ))}
    </aside>
  );
}

function PaletteItem({type, label}) {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `palette-${type}`,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-item${isDragging ? ' dragging' : ''}`}
    >
      {label}
    </div>
  );
}

function RootDropzone({tree}) {
  const {setNodeRef} = useDroppable({
    id: 'dropzone-root',
    data: {containerType: 'root', containerId: null},
  });
  const ids = tree.map((s) => s.id);

  return (
    <div ref={setNodeRef} className="root-canvas">
      {tree.length === 0 && (
        <p className="empty-hint">Drag a "Section" here to start building.</p>
      )}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {tree.map((section) => (
          <SortableSection key={section.id} node={section} />
        ))}
      </SortableContext>
    </div>
  );
}

function SortableSection({node}) {
  const select = useBuilderStore((s) => s.select);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const removeNode = useBuilderStore((s) => s.removeNode);
  const duplicateNode = useBuilderStore((s) => s.duplicateNode);
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
    id: node.id,
    data: {containerType: 'root', containerId: null},
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: node.style.background || '#fff',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-node canvas-section${selectedId === node.id ? ' selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        select(node.id);
      }}
    >
      <NodeToolbar
        label="Section"
        dragHandleProps={{...attributes, ...listeners}}
        onDelete={() => removeNode(node.id)}
        onDuplicate={() => duplicateNode(node.id)}
      />
      <ColumnsDropzone section={node} />
    </div>
  );
}

function ColumnsDropzone({section}) {
  const {setNodeRef} = useDroppable({
    id: `dropzone-columns-${section.id}`,
    data: {containerType: 'columns', containerId: section.id},
  });
  const ids = section.children.map((c) => c.id);

  return (
    <div ref={setNodeRef} className="columns-row">
      {section.children.length === 0 && (
        <p className="empty-hint">Drag a "Column" here.</p>
      )}
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        {section.children.map((column) => (
          <SortableColumn key={column.id} node={column} sectionId={section.id} />
        ))}
      </SortableContext>
    </div>
  );
}

const WIDTH_TO_FLEX = {
  '1/1': '0 0 100%',
  '1/2': '0 0 50%',
  '1/3': '0 0 33.333%',
  '1/4': '0 0 25%',
  '2/3': '0 0 66.666%',
  '3/4': '0 0 75%',
};

function SortableColumn({node, sectionId}) {
  const select = useBuilderStore((s) => s.select);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const removeNode = useBuilderStore((s) => s.removeNode);
  const duplicateNode = useBuilderStore((s) => s.duplicateNode);
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
    id: node.id,
    data: {containerType: 'columns', containerId: sectionId},
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    flex: WIDTH_TO_FLEX[node.props.widthDesktop] || '0 0 100%',
    background: node.style.background || 'transparent',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-node canvas-column${selectedId === node.id ? ' selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        select(node.id);
      }}
    >
      <NodeToolbar
        label="Column"
        dragHandleProps={{...attributes, ...listeners}}
        onDelete={() => removeNode(node.id)}
        onDuplicate={() => duplicateNode(node.id)}
      />
      <ElementsDropzone column={node} />
    </div>
  );
}

function ElementsDropzone({column}) {
  const {setNodeRef} = useDroppable({
    id: `dropzone-elements-${column.id}`,
    data: {containerType: 'elements', containerId: column.id},
  });
  const ids = column.children.map((c) => c.id);

  return (
    <div ref={setNodeRef} className="elements-list">
      {column.children.length === 0 && (
        <p className="empty-hint">Drag content here.</p>
      )}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {column.children.map((el) => (
          <SortableElement key={el.id} node={el} columnId={column.id} />
        ))}
      </SortableContext>
    </div>
  );
}

function SortableElement({node, columnId}) {
  const select = useBuilderStore((s) => s.select);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const removeNode = useBuilderStore((s) => s.removeNode);
  const duplicateNode = useBuilderStore((s) => s.duplicateNode);
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
    id: node.id,
    data: {containerType: 'elements', containerId: columnId},
  });

  const style = {transform: CSS.Transform.toString(transform), transition};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-node canvas-element${selectedId === node.id ? ' selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        select(node.id);
      }}
    >
      <NodeToolbar
        label={ELEMENT_DEFS[node.type]?.label || node.type}
        dragHandleProps={{...attributes, ...listeners}}
        onDelete={() => removeNode(node.id)}
        onDuplicate={() => duplicateNode(node.id)}
      />
      <ElementPreview node={node} />
    </div>
  );
}

function ElementPreview({node}) {
  switch (node.type) {
    case 'Heading': {
      const Tag = node.props.tag || 'h2';
      return <Tag style={{textAlign: node.style.align}}>{node.props.text}</Tag>;
    }
    case 'RichText':
      return (
        <div style={{textAlign: node.style.align}}>
          {(node.props.content || '').split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      );
    case 'CTAButton':
      return <button className={`preview-btn ${node.style.styleVariant}`}>{node.props.label}</button>;
    case 'ImageBlock':
      return node.props.src ? (
        <img src={node.props.src} alt={node.props.alt} style={{maxWidth: '100%'}} />
      ) : (
        <div className="image-placeholder">No image set</div>
      );
    case 'ProductGrid':
      return (
        <div className="product-grid-placeholder">
          Product Grid — collection: <code>{node.props.collectionHandle || '(not set)'}</code>,{' '}
          {node.props.limit} products
        </div>
      );
    default:
      return null;
  }
}

function NodeToolbar({label, dragHandleProps, onDelete, onDuplicate}) {
  return (
    <div className="node-toolbar" onClick={(e) => e.stopPropagation()}>
      <span className="node-label" {...dragHandleProps}>
        ⠿ {label}
      </span>
      <button onClick={onDuplicate} title="Duplicate">
        ⧉
      </button>
      <button onClick={onDelete} title="Delete">
        ×
      </button>
    </div>
  );
}
