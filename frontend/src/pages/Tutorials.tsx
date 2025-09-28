import React from 'react';
import { Link } from 'react-router-dom';
import { tutorials } from '../data/content';

const Tutorials: React.FC = () => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary mb-4">Tutorials</h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Step-by-step guides to help you integrate sso.broker with your identity providers
          </p>
        </div>
        
        {/* Tutorials Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial.id}
              to={`/tutorials/${tutorial.id}`}
              className="group block"
            >
              <article className="bg-secondary rounded-2xl shadow-xl overflow-hidden border border-primary hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                {/* Tutorial Header */}
                <div className="bg-primary px-6 py-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-accent rounded-lg p-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-secondary text-sm font-medium">{tutorial.category}</span>
                  </div>
                  <h2 className="text-xl font-bold text-secondary mb-2 line-clamp-2">
                    {tutorial.title}
                  </h2>
                  <p className="text-secondary text-sm leading-relaxed line-clamp-2">
                    {tutorial.description}
                  </p>
                </div>
                
                {/* Tutorial Content */}
                <div className="px-6 py-6">
                  {/* Meta Information */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-secondary">{tutorial.estimatedTime}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(tutorial.difficulty)}`}>
                      {tutorial.difficulty}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutorial.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-accent text-primary text-xs rounded-md border border-primary"
                      >
                        {tag}
                      </span>
                    ))}
                    {tutorial.tags.length > 3 && (
                      <span className="px-2 py-1 bg-accent text-primary text-xs rounded-md border border-primary">
                        +{tutorial.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  {/* Read More */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Last updated: {new Date(tutorial.lastUpdated).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                      <span className="text-sm font-medium">Read Tutorial</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-accent border border-primary rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">Need Help Getting Started?</h3>
            <p className="text-secondary mb-6">
              Our tutorials cover everything from basic SAML setup to advanced enterprise configurations. 
              Can't find what you're looking for? Let us know!
            </p>
            <a
              href="https://github.com/evantobin/sso.broker"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-secondary rounded-lg font-medium hover:bg-accent transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Request a Tutorial
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;