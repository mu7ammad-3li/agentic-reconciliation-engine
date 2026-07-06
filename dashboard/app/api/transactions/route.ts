import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    
    let dbQuery = `
      SELECT t.*, a.owner_name as to_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.to_account_id = a.id
    `;
    
    const queryParams = [];
    
    if (search) {
      dbQuery += ` WHERE t.id::text ILIKE $1 OR t.status ILIKE $1 OR t.review_status ILIKE $1`;
      queryParams.push(`%${search}%`);
    }
    
    dbQuery += ` ORDER BY t.created_at DESC LIMIT 200`;
    
    const { rows } = await query(dbQuery, queryParams);
    
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
