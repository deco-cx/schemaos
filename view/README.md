# SchemaOS - AI-Powered Data Schema Editor

A beautiful, interactive data schema editor that showcases the power of AI-assisted development. Built with React, ReactFlow, and Tailwind CSS.

![SchemaOS](https://img.shields.io/badge/SchemaOS-AI%20Powered-blue)

## ✨ Features

### 🎨 Visual Schema Design
- **Drag-and-Drop Interface**: Easily create tables by dragging from the palette
- **Interactive Canvas**: Pan, zoom, and navigate your schema with ReactFlow
- **Beautiful Nodes**: Custom-designed nodes with field type indicators and status badges
- **Smart Relationships**: Draw connections between tables with automatic relationship type suggestions

### 🤖 AI-Powered Intelligence
- **Smart Field Suggestions**: AI analyzes table names to suggest relevant fields
- **Relationship Detection**: Automatic detection of relationship types (1-1, 1-N, N-N)
- **Context-Aware**: Suggestions based on common patterns (user, product, order, etc.)

### 🔌 Data Source Integration
- **Mock Bindings**: Pre-configured data sources (Airtable, Shopify, Stripe, HubSpot, PostgreSQL)
- **Capability Badges**: Visual indicators for PaginatedList, WebhookSource, and BulkExport
- **Schema Import**: Automatically import fields from connected data sources

### 💾 Persistence & Export
- **Auto-Save**: Schemas are automatically saved to localStorage
- **Export/Import**: Download schemas as JSON files for sharing or backup
- **Version Control**: Each export includes version and timestamp

### 🎯 Developer Experience
- **TypeScript**: Full type safety throughout the application
- **Modern Stack**: React 18, Vite, Tailwind CSS, ReactFlow
- **Component Architecture**: Clean, modular components with shadcn/ui
- **Performance**: Optimized rendering with React memo and efficient state management

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎮 How to Use

1. **Create Tables**:
   - Drag "Blank Table" from the palette to create a custom table
   - Or drag a data source (e.g., Airtable, Shopify) to create a connected table

2. **Add Fields**:
   - Select a table to open the property panel
   - Click "Add Field" to manually add fields
   - Or use the AI Assistant tab to auto-generate fields

3. **Define Relationships**:
   - Drag from one table's handle to another to create a relationship
   - AI will suggest the relationship type based on table names

4. **Save & Export**:
   - Your work is automatically saved
   - Click "Export" to download as JSON
   - Use "Import" to load a previously saved schema

## 🏗️ Architecture

```
view/
├── src/
│   ├── canvas/           # ReactFlow canvas components
│   │   ├── Canvas.tsx    # Main canvas container
│   │   ├── nodes/        # Custom node components
│   │   └── edges/        # Custom edge components
│   ├── sidebar/          # Side panel components
│   │   ├── Palette.tsx   # Draggable items palette
│   │   └── PropertyPanel.tsx # Node property editor
│   ├── components/ui/    # shadcn/ui components
│   ├── store.ts          # Zustand state management
│   ├── aiMock.ts         # Mock AI suggestions
│   └── mockData.ts       # Sample data sources
└── ...
```

## 🎨 Design Philosophy

SchemaOS embodies the principle of "radically simple and radically different" by:

- **Just-in-Time Generation**: AI assists only when needed, not overwhelming users
- **Visual-First**: Complex relationships become simple through visualization
- **Progressive Disclosure**: Advanced features reveal themselves as needed
- **Instant Feedback**: Every action has immediate visual response

## 🔧 Customization

### Adding New Data Sources

```typescript
// In mockData.ts
export const MOCK_BINDINGS: MockBinding[] = [
  {
    id: 'your-service.resource',
    provider: 'Your Service',
    capabilities: ['PaginatedList'],
    schema: { /* ... */ }
  }
];
```

### Custom Field Types

```typescript
// In mockData.ts
export const FIELD_TYPE_SUGGESTIONS = [
  'string',
  'number',
  'your-custom-type',
  // ...
];
```

### AI Behavior

Modify `aiMock.ts` to customize AI suggestions based on your patterns.

## 🌟 Showcase Features

- **Smooth Animations**: Every interaction is beautifully animated
- **Responsive Design**: Works on desktop and tablet devices
- **Empty States**: Helpful guidance when starting fresh
- **Error Prevention**: Smart validation prevents invalid connections
- **Accessibility**: Keyboard navigation and screen reader support

## 🚧 Future Enhancements

This is a showcase prototype. In a production version, you might add:

- Real backend integration
- Collaborative editing
- Schema validation
- Code generation
- Database migration scripts
- API endpoint generation
- Version history
- Team workspaces

## 📝 License

This is a demo application showcasing modern web development techniques.

---

Built with ❤️ to demonstrate the power of AI-assisted development and modern React patterns. 