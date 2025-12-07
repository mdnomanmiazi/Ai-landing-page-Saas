import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Initialize Supabase (Directly here to avoid import path issues)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Fetch the HTML code for this specific ID
  const { data, error } = await supabase
    .from('generations')
    .select('html_code')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return new NextResponse('Website not found', { status: 404 });
  }

  // 3. Return the HTML as a real webpage
  return new NextResponse(data.html_code, {
    headers: {
      'Content-Type': 'text/html', // This tells the browser "Render this as a website"
    },
  });
}
