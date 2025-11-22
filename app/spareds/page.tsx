'use client';

import React from 'react';
import Link from 'next/link';

export default function SpareDSPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-[#1A1A8F] via-[#2A2AB8] to-[#4A4AF2] rounded-2xl p-12 text-white">
          <h1 className="text-5xl font-bold mb-4">Welcome to Spare Design System</h1>
          <p className="text-xl mb-6 text-blue-100">
            A comprehensive design system with semantic tokens following a 4-level hierarchy. 
            Build consistent, accessible, and scalable user interfaces.
          </p>
          <div className="flex gap-4">
            <Link
              href="/spareds/styles/colour"
              className="px-6 py-3 bg-white text-[#1A1A8F] rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/spareds/about/principles"
              className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Design Principles
            </Link>
          </div>
        </div>
      </div>

      {/* Hierarchy Overview */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-foreground">4-Level Hierarchy</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              level: 1,
              name: 'Default Values',
              desc: 'Raw values (hex, pixels)',
              color: 'bg-muted',
              href: '/spareds/tokens/default-values',
            },
            {
              level: 2,
              name: 'Foundation',
              desc: 'Primitive tokens',
              color: 'bg-blue-100 dark:bg-blue-900',
              href: '/spareds/tokens/foundation',
            },
            {
              level: 3,
              name: 'Semantic',
              desc: 'Semantic tokens',
              color: 'bg-purple-100 dark:bg-purple-900',
              href: '/spareds/tokens/semantic',
            },
            {
              level: 4,
              name: 'Component',
              desc: 'Component tokens',
              color: 'bg-pink-100 dark:bg-pink-900',
              href: '/spareds/tokens/component',
            },
          ].map((item) => (
            <Link
              key={item.level}
              href={item.href}
              className={`${item.color} p-6 rounded-lg cursor-pointer transition-transform hover:scale-105`}
            >
              <div className="text-4xl font-bold mb-2">{item.level}</div>
              <div className="font-semibold text-lg mb-1">{item.name}</div>
              <div className="text-sm opacity-75">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-foreground">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/spareds/styles/colour"
            className="border border-border rounded-lg p-6 bg-card hover:bg-accent transition-colors"
          >
            <div className="text-2xl mb-2">🎨</div>
            <div className="font-semibold mb-2 text-foreground">Styles</div>
            <div className="text-sm text-muted-foreground">
              Colors, typography, spacing, and more
            </div>
          </Link>
          <Link
            href="/spareds/components/buttons"
            className="border border-border rounded-lg p-6 bg-card hover:bg-accent transition-colors"
          >
            <div className="text-2xl mb-2">🧩</div>
            <div className="font-semibold mb-2 text-foreground">Components</div>
            <div className="text-sm text-muted-foreground">
              UI component library
            </div>
          </Link>
          <Link
            href="/spareds/tokens/default-values"
            className="border border-border rounded-lg p-6 bg-card hover:bg-accent transition-colors"
          >
            <div className="text-2xl mb-2">🔑</div>
            <div className="font-semibold mb-2 text-foreground">Tokens</div>
            <div className="text-sm text-muted-foreground">
              Design tokens and values
            </div>
          </Link>
          <Link
            href="/spareds/content/tone"
            className="border border-border rounded-lg p-6 bg-card hover:bg-accent transition-colors"
          >
            <div className="text-2xl mb-2">✍️</div>
            <div className="font-semibold mb-2 text-foreground">Content</div>
            <div className="text-sm text-muted-foreground">
              Writing and content guidelines
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-foreground">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-2 text-foreground">🎯 Semantic</h3>
            <p className="text-muted-foreground">
              Tokens organized by purpose, not by value
            </p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-2 text-foreground">📐 Hierarchical</h3>
            <p className="text-muted-foreground">
              4 levels of abstraction for maximum flexibility
            </p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-2 text-foreground">🌓 Dark Mode</h3>
            <p className="text-muted-foreground">
              Full support for light and dark themes
            </p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-2 text-foreground">🔌 Public API</h3>
            <p className="text-muted-foreground">
              Access tokens via REST API or static JSON
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
