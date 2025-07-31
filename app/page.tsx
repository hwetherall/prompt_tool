import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          Build Better Prompts Together
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create, organize, and compose reusable AI prompt snippets with hierarchical structure and multi-LLM generation.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/snippets/new">
            <Button size="lg">Create Your First Snippet</Button>
          </Link>
          <Link href="/snippets">
            <Button variant="secondary" size="lg">Browse Snippets</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="mb-2">Hierarchical Organization</h3>
            <p className="text-gray-600">
              Organize snippets with intuitive naming like <span className="snippet-name">geo_asia_japan</span> for easy discovery
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="mb-2">Multi-LLM Generation</h3>
            <p className="text-gray-600">
              Generate snippets using Claude, GPT-4, and Grok, then combine for best results
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <h3 className="mb-2">Composable Prompts</h3>
            <p className="text-gray-600">
              Build complex prompts using <span className="snippet-name">{`{{snippet_name}}`}</span> syntax for reusability
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2">Client Folders</h3>
            <p className="text-gray-600">
              Organize snippets into General and Client-specific collections for better management
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-16 bg-gray-100 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h4 className="font-semibold mb-1">Create a Snippet</h4>
              <p className="text-gray-600">Name your snippet hierarchically (e.g., <span className="snippet-name">investment_SeriesB</span>) and provide context</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h4 className="font-semibold mb-1">AI-Powered Generation</h4>
              <p className="text-gray-600">System finds similar snippets and generates content using multiple LLMs</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h4 className="font-semibold mb-1">Compose & Use</h4>
              <p className="text-gray-600">Reference snippets in prompts: "Analyze this <span className="snippet-name">{`{{investment_SeriesB}}`}</span> in <span className="snippet-name">{`{{geo_asia_japan}}`}</span>"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
