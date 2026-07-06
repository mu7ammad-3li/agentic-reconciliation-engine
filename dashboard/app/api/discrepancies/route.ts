import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT 
        i.*,
        r.account_id,
        r.period_start,
        r.period_end
      FROM reconciliation_items i
      JOIN reconciliation_runs r ON i.run_id = r.id
      WHERE i.match_status != 'matched'
        AND i.review_status IS NULL
      ORDER BY i.ai_confidence ASC, i.created_at DESC
      LIMIT 100
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
