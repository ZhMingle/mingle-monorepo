# Online Notebook

A Notion-like online notebook application built with Next.js.

## Features

- 📝 Multi-page management
- ✏️ Rich text block editing (headings, paragraphs, lists)
- 💾 Database storage (PostgreSQL)
- 🔐 User authentication
- 🎨 Clean and beautiful interface
- ⚡ Fast and responsive

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (see [DATABASE_SETUP.md](./DATABASE_SETUP.md) for setup instructions)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth (generate a random string)
- `NEXTAUTH_URL` - Application URL (e.g., http://localhost:3000)

3. Set up database:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Create a new page**: Click the "+ New Page" button in the sidebar
2. **Edit title**: Click the title input at the top of the page
3. **Add content blocks**:
   - Type directly to create a paragraph
   - Type "/" to see available block types
   - Supports Heading 1/2/3, Paragraph, Bullet List, Numbered List
4. **Delete block**: Clear block content and press Backspace
5. **Delete page**: Hover over a page item in the sidebar and click the × button

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma** - ORM for database management
- **PostgreSQL** - Database
- **NextAuth** - Authentication
- **CSS Modules** - Styling

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Future Plans

- [ ] Support more block types (code blocks, quotes, tables, etc.)
- [ ] Drag and drop sorting
- [ ] Search functionality
- [ ] Real-time collaboration
- [ ] Markdown export/import

