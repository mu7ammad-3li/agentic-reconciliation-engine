import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT * FROM reconciliation_runs 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
