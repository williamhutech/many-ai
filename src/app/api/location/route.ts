import { NextResponse } from 'next/server';

const IPINFO_TOKEN = process.env.IPINFO_TOKEN || '';

export async function GET(request: Request) {
  try {
    // Get client IP from various headers
    const headers = request.headers;
    let ip = headers.get('x-real-ip') || 
             headers.get('x-forwarded-for')?.split(',')[0] ||
             headers.get('cf-connecting-ip') ||
             request.headers.get('x-client-ip') ||
             '127.0.0.1';

    // Handle IPv6 localhost
    if (ip === '::1' || ip === '127.0.0.1') {
      // For local development, use a fallback to get real IP
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ip = data.ip;
      } catch (error) {
        console.error('❌ Error fetching real IP:', error);
      }
    }
    
    console.log('🌐 Client IP:', ip);

    // Call ipinfo API
    const response = await fetch(`https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`);
    const data = await response.json();
    
    console.log('📍 IPInfo Response:', {
      ip: data.ip,
      country: data.country,
      city: data.city,
      region: data.region,
      loc: data.loc,
      org: data.org
    });

    return NextResponse.json({ 
      country: data.country,
      ip: ip 
    });
  } catch (error) {
    console.error('❌ Error fetching location:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch location',
      country: null,
      ip: null 
    }, { status: 500 });
  }
}
