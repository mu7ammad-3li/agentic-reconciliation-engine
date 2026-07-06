import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const runResult = await query(`SELECT * FROM reconciliation_runs WHERE id = $1`, [id]);
    if (runResult.rowCount === 0) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const itemsResult = await query(`
      SELECT * FROM reconciliation_items 
      WHERE run_id = $1 
      ORDER BY match_status, ai_confidence ASC
    `, [id]);

    return NextResponse.json({
      run: runResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
