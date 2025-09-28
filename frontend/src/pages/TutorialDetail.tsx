import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { tutorials } from '../data/content';

const TutorialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tutorial = tutorials.find(t => t.id === id);

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Tutorial Not Found</h1>
          <p className="text-secondary mb-8">The tutorial you're looking for doesn't exist.</p>
          <Link
            to="/tutorials"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-secondary rounded-lg font-medium hover:bg-accent transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tutorials
          </Link>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <div key={`code-${i}`} className="my-4">
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                  <span className="text-gray-300 text-sm font-medium">{codeBlockLanguage || 'Code'}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(codeBlockContent.join('\n'))}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                    title="Copy code"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="text-green-400 text-sm leading-relaxed font-mono">
                    {codeBlockContent.join('\n')}
                  </code>
                </pre>
              </div>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLanguage = '';
        } else {
          // Start of code block
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
        }
      } else if (inCodeBlock) {
        codeBlockContent.push(line);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-3xl font-bold text-primary mb-4 mt-8">{line.substring(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-2xl font-bold text-primary mb-3 mt-6">{line.substring(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-xl font-bold text-primary mb-2 mt-4">{line.substring(4)}</h3>);
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(<p key={i} className="text-primary font-semibold mb-2">{line.substring(2, line.length - 2)}</p>);
      } else if (line.startsWith('- ')) {
        elements.push(<li key={i} className="text-secondary mb-1 ml-4">{line.substring(2)}</li>);
      } else if (line.trim() === '') {
        // Skip empty lines to reduce spacing
        continue;
      } else if (line.trim()) {
        elements.push(<p key={i} className="text-secondary mb-3 leading-relaxed">{line}</p>);
      }
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/tutorials"
            className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tutorials
          </Link>
        </div>

        {/* Tutorial Header */}
        <article className="bg-secondary rounded-2xl shadow-xl overflow-hidden border border-primary">
          <div className="px-8 py-8 border-b border-primary">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary rounded-lg p-2">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-secondary text-sm font-medium">{tutorial.category}</span>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-3">
              {tutorial.title}
            </h1>
            <p className="text-secondary text-lg leading-relaxed">
              {tutorial.description}
            </p>
          </div>
          
          {/* Tutorial Meta */}
          <div className="px-8 py-6 border-b border-primary">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-secondary">{tutorial.estimatedTime}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(tutorial.difficulty)}`}>
                {tutorial.difficulty}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-secondary">Updated {new Date(tutorial.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {tutorial.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-accent text-primary text-sm rounded-md border border-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Tutorial Content */}
          <div className="px-8 py-8">
            <div className="max-w-none">
              {formatContent(tutorial.content)}
            </div>
          </div>
        </article>
        
        {/* Related Actions */}
        <div className="mt-12 text-center">
          <div className="bg-accent border border-primary rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Found This Helpful?</h3>
            <p className="text-secondary mb-6">
              Check out our other tutorials or contribute to the project on GitHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/tutorials"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-secondary rounded-lg font-medium hover:bg-accent transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Browse More Tutorials
              </Link>
              <a
                href="https://github.com/evantobin/sso.broker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-primary rounded-lg font-medium border border-primary hover:bg-primary hover:text-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialDetail;
