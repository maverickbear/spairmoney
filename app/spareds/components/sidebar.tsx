'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'ABOUT',
    icon: '📖',
    children: [
      { title: 'Welcome', href: '/spareds' },
      { title: 'Design Principles', href: '/spareds/about/principles' },
      { title: 'Accessibility', href: '/spareds/about/accessibility' },
      { title: 'Change Log', href: '/spareds/about/changelog' },
      { title: 'Status Table', href: '/spareds/about/status' },
    ],
  },
  {
    title: 'BRAND',
    icon: '🎨',
    children: [
      { title: 'Brand Guidelines', href: '/spareds/brand/guidelines' },
      { title: 'Logo', href: '/spareds/brand/logo' },
      { title: 'Writing Guidelines', href: '/spareds/brand/writing' },
      { title: 'Imagery', href: '/spareds/brand/imagery' },
    ],
  },
  {
    title: 'STYLES',
    icon: '🎨',
    children: [
      { title: 'Colour', href: '/spareds/styles/colour' },
      { title: 'Typography', href: '/spareds/styles/typography' },
      { title: 'Icon', href: '/spareds/styles/icon' },
      { title: 'Spacing', href: '/spareds/styles/spacing' },
      { title: 'Shadow', href: '/spareds/styles/shadow' },
    ],
  },
  {
    title: 'TOKENS',
    icon: '🔑',
    children: [
      { title: 'Default Values', href: '/spareds/tokens/default-values' },
      { title: 'Foundation', href: '/spareds/tokens/foundation' },
      { title: 'Semantic', href: '/spareds/tokens/semantic' },
      { title: 'Component', href: '/spareds/tokens/component' },
    ],
  },
  {
    title: 'COMPONENTS',
    icon: '🧩',
    children: [
      { title: 'Buttons', href: '/spareds/components/buttons' },
      { title: 'Cards', href: '/spareds/components/cards' },
      { title: 'Inputs', href: '/spareds/components/inputs' },
      { title: 'Badges', href: '/spareds/components/badges' },
      { title: 'Alerts', href: '/spareds/components/alerts' },
      { title: 'Dialogs', href: '/spareds/components/dialogs' },
      { title: 'Tabs', href: '/spareds/components/tabs' },
      { title: 'Select', href: '/spareds/components/select' },
      { title: 'Checkbox', href: '/spareds/components/checkbox' },
      { title: 'Switch', href: '/spareds/components/switch' },
      { title: 'Tooltip', href: '/spareds/components/tooltip' },
      { title: 'Progress', href: '/spareds/components/progress' },
      { title: 'Skeleton', href: '/spareds/components/skeleton' },
    ],
  },
  {
    title: 'CONTENT DESIGN',
    icon: '✍️',
    children: [
      { title: 'Tone of Voice', href: '/spareds/content/tone' },
      { title: 'Capitalization', href: '/spareds/content/capitalization' },
      { title: 'Punctuation', href: '/spareds/content/punctuation' },
      { title: 'Date & Time', href: '/spareds/content/datetime' },
      { title: 'Currency', href: '/spareds/content/currency' },
      { title: 'Number Formatting', href: '/spareds/content/numbers' },
      { title: 'Truncating Text', href: '/spareds/content/truncating' },
    ],
  },
  {
    title: 'API',
    icon: '🔌',
    href: '/api/spareds/docs',
    external: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['ABOUT', 'STYLES', 'TOKENS', 'COMPONENTS']);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/spareds') {
      return pathname === '/spareds';
    }
    // For ABOUT section, check if it's the welcome page
    if (href === '/spareds/about/principles' && pathname === '/spareds') {
      return false;
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <Link href="/spareds" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-scale-500 to-primary-scale-400 flex items-center justify-center text-white font-bold">
            S
          </div>
            <div>
              <div className="font-bold text-lg bg-gradient-to-r from-primary-scale-500 to-primary-scale-400 bg-clip-text text-transparent">
                SpareDS
              </div>
              <div className="text-xs text-muted-foreground">
                Design System
              </div>
            </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.href ? (
                <Link
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.title}</span>
                  {item.external && (
                    <span className="ml-auto text-xs">↗</span>
                  )}
                </Link>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleExpand(item.title)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                      expandedItems.includes(item.title)
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium flex-1 text-left">{item.title}</span>
                    <span
                      className={`transition-transform ${
                        expandedItems.includes(item.title) ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </span>
                  </Button>
                  {expandedItems.includes(item.title) && item.children && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive(child.href)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div>SpareDS v1.0.0</div>
          <div className="mt-1">Spare Finance</div>
        </div>
      </div>
    </aside>
  );
}

