import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    return NextResponse.json({
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing',
        supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Missing',
      },
      message: 'Environment check completed'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    )
  }
}
