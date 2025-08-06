# 🎨 **SchemaOS** - AI-Powered Visual Database Designer

**Transform your data architecture with AI-assisted visual schema design.** Create beautiful database schemas through an intuitive drag-and-drop interface powered by intelligent suggestions.

![SchemaOS](https://img.shields.io/badge/SchemaOS-AI%20Powered-gradient?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Closed%20Beta-yellow?style=for-the-badge)
![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20Deco-blue?style=for-the-badge)

## ✨ **What Makes SchemaOS Special**

### 🤖 **AI-Powered Intelligence**
- **Smart Field Suggestions** - AI analyzes your table names and suggests relevant fields
- **Relationship Detection** - Automatic relationship type inference (1-1, 1-N, N-N)
- **SQL Generation** - Convert visual schemas to production-ready SQL
- **Import from DB** - Introspect existing databases and visualize their structure

### 🎯 **Visual Schema Design**
- **Drag & Drop Canvas** - Create tables effortlessly with ReactFlow
- **Beautiful Nodes** - Custom-designed components with type indicators
- **Smart Connections** - Draw relationships with automatic type detection
- **Real-time Preview** - See your data structure come to life instantly

### 🔌 **Data Source Integration**
- **10+ Integrations** - Shopify, Stripe, Airtable, PostgreSQL, Discord, and more
- **Live Introspection** - Connect to real databases and import schemas
- **Mock & Real Data** - Test with mock data or connect to production

## 🚀 **Get Started**

### **Option 1: Run with Deco** *(Recommended)*

[![Run with Deco](https://img.shields.io/badge/Run%20with%20Deco-Deploy%20Now-gradient?style=for-the-badge)](https://deco.chat)

> ⚠️ **Currently in closed beta** - Request access at [deco.chat](https://deco.chat)

### **Option 2: Clone & Run Locally** *(Temporary)*

**Prerequisites:** 
- **Deco CLI** installed ([instructions](http://github.com/deco-cx/chat))

```bash
# 1. Clone the repository
git clone https://github.com/deco-cx/schemaos.git
cd schemaos

# 2. Configure the server
cd server && deco configure
# → Choose your workspace
# → Press Enter for other options

# 3. Start development
cd ../ && npm run dev
```

Your SchemaOS instance will be running at **`http://localhost:8787`** 🎉

## 🎮 **How to Use**

1. **📦 Create Tables** - Drag from palette or import from data sources
2. **🏗️ Add Fields** - Manual entry or AI-powered suggestions
3. **🔗 Define Relationships** - Connect tables with smart relationship detection
4. **💾 Export & Share** - Download as JSON or generate SQL

## 🏆 **Key Features**

| Feature | Description |
|---------|-------------|
| **🎨 Visual Editor** | Intuitive drag-and-drop interface |
| **🤖 AI Assistant** | Context-aware field and relationship suggestions |
| **🔌 10+ Integrations** | Connect to popular databases and APIs |
| **📊 Data Explorer** | Browse and filter your schema visually |
| **💾 Auto-Save** | Never lose your work |
| **📤 Import/Export** | JSON, SQL, and more formats |
| **🌙 Dark Mode** | Easy on the eyes |
| **⚡ Real-time** | Instant updates and previews |

## 🛠️ **Tech Stack**

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Canvas:** ReactFlow for visual editing
- **Backend:** Deco Workers + SQLite
- **AI:** GPT-4 powered suggestions
- **State:** Zustand for performance
- **UI:** shadcn/ui components

## 🤝 **Contributing**

SchemaOS is currently in **closed beta**. We're working hard to make it available to everyone soon!

**Want early access?** [Join the waitlist](https://deco.chat)

## 📬 **Contact**

- **Website:** [deco.chat](https://deco.chat)
- **GitHub:** [deco-cx/schemaos](https://github.com/deco-cx/schemaos)
- **Discord:** [Join our community](https://discord.gg/deco)

---

<p align="center">
  <strong>Built with ❤️ by the Deco team</strong><br>
  <em>Making database design beautiful and intelligent</em>
</p>