import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Create a simple frame image using SVG
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Main Content -->
      <g transform="translate(100, 100)">
        <!-- Logo/Icon -->
        <rect x="0" y="0" width="120" height="120" rx="20" fill="white" opacity="0.9"/>
        <text x="60" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="#3B82F6">🔨</text>
        
        <!-- Title -->
        <text x="160" y="60" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">ToolForge</text>
        
        <!-- Subtitle -->
        <text x="160" y="100" font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.9">
          Base &amp; Farcaster Mini App Asset Creator
        </text>
        
        <!-- Features -->
        <g transform="translate(0, 150)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.8">✨ Create Icons, Splash Screens, Banners</text>
          <text x="0" y="35" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.8">🎨 Optimized for Base &amp; Farcaster</text>
          <text x="0" y="70" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.8">📱 Perfect Mini App Assets</text>
        </g>
        
        <!-- Call to Action -->
        <rect x="0" y="280" width="300" height="60" rx="30" fill="white" opacity="0.2"/>
        <text x="150" y="320" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
          Start Creating Assets
        </text>
      </g>
      
      <!-- Decorative Elements -->
      <circle cx="1000" cy="100" r="50" fill="white" opacity="0.1"/>
      <circle cx="1100" cy="200" r="30" fill="white" opacity="0.1"/>
      <circle cx="1050" cy="400" r="40" fill="white" opacity="0.1"/>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
