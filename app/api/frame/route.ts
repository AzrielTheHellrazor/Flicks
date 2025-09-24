import { FrameRequest, getFrameMessage } from 'frames.js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: FrameRequest = await req.json();
    
    // Verify the frame message
    const { isValid, message } = await getFrameMessage(body);
    
    if (!isValid || !message) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Handle different button actions
    const buttonIndex = message.buttonIndex;
    
    switch (buttonIndex) {
      case 1:
        // Open ToolForge app
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/frame/image" />
              <meta property="fc:frame:button:1" content="Create Assets" />
              <meta property="fc:frame:button:2" content="Learn More" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/frame" />
            </head>
            <body>
              <h1>ToolForge - Asset Creator</h1>
              <p>Create visual assets for your Base and Farcaster mini apps!</p>
            </body>
          </html>
          `,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
        
      case 2:
        // Redirect to main app
        return NextResponse.redirect(
          new URL('/', req.url)
        );
        
      default:
        return new NextResponse('Invalid button', { status: 400 });
    }
  } catch (error) {
    console.error('Frame error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Initial frame
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/frame/image" />
        <meta property="fc:frame:button:1" content="Open ToolForge" />
        <meta property="fc:frame:button:2" content="Learn More" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/frame" />
      </head>
      <body>
        <h1>ToolForge</h1>
        <p>Create visual assets for Base and Farcaster mini apps</p>
      </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}
