# Prompt Builder App

A collaborative prompt engineering tool that allows users to create, store, and compose AI prompt snippets with hierarchical organization and multi-LLM generation.

## Features

- **Hierarchical Snippet Organization**: Organize snippets with intuitive naming like `geo_asia_japan`, `investment_SeriesB`
- **Multi-LLM Generation**: Generate snippets using Claude 3 Opus, GPT-4 Turbo, and Grok, then combine for best results
- **Snippet Composition**: Build complex prompts using `{{snippet_name}}` syntax for maximum reusability
- **Smart Similarity Detection**: Automatically find related snippets based on hierarchical naming
- **Real-time Template Rendering**: Preview composed prompts with all snippets expanded

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **LLM Integration**: OpenRouter API
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenRouter API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/prompt-builder.git
cd prompt-builder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL from `supabase.sql` to create the database schema
4. Copy your project URL and anon key from Project Settings > API

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage Guide

### Creating a Snippet

1. Navigate to **Snippets > New Snippet**
2. Enter a hierarchical name (e.g., `marketing_email_welcome`)
3. Provide context: "Create a warm, professional welcome email template for new SaaS customers"
4. The system will find similar snippets like `marketing_email_onboarding`
5. Click **Generate with Multi-LLM** to create content
6. Review and save the generated snippet

### Composing Prompts

1. Go to **Prompts > New Prompt**
2. Create a template using snippet references:
   ```
   You are analyzing a {{investment_SeriesB}} investment opportunity 
   in {{geo_asia_japan}} for a company in the {{industry_tech_ai}} sector.
   
   Consider {{market_analysis_competitive}} factors and provide insights.
   ```
3. Click **Render Template** to see the full expanded prompt
4. Save the composed prompt for future use

### Snippet Naming Convention

Use underscore-separated hierarchical names:
- `geo_` - Geographic regions
  - `geo_asia_japan`
  - `geo_europe_germany`
- `investment_` - Investment types
  - `investment_SeriesA`
  - `investment_SeriesB`
- `industry_` - Industry sectors
  - `industry_tech_ai`
  - `industry_healthcare_biotech`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/snippets` | GET, POST | List/create snippets |
| `/api/snippets/[name]` | GET, PUT, DELETE | Manage individual snippets |
| `/api/similarity` | GET | Find similar snippets |
| `/api/generate` | POST | Multi-LLM generation |
| `/api/render` | POST | Render templates |
| `/api/prompts` | GET, POST | List/create composed prompts |
| `/api/prompts/[id]` | GET, PUT, DELETE | Manage individual prompts |

## Project Structure

```
prompt-builder/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── snippets/          # Snippet pages
│   └── prompts/           # Prompt pages
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
│   ├── supabase.ts       # Database operations
│   ├── similarity.ts     # Similarity algorithm
│   ├── snippet-utils.ts  # Template rendering
│   └── openrouter.ts     # LLM integration
└── database/             # Database schema
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel settings
4. Deploy!

### Environment Variables for Production

Make sure to set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
