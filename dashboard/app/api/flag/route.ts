import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transaction_id, review_status, reason } = await request.json();

    // In a real scenario, this would use grpc-js to call the Go backend directly.
    // However, to avoid setting up grpc-js parsing in Next.js, we assume the Ledger API 
    // exposes a REST bridge, or we just update the DB directly as a simplified proxy for the demo.
    
    import('@/lib/db').then(async ({ query }) => {
      await query(
        `UPDATE transactions SET review_status = $1 WHERE id = $2`,
        [review_status, transaction_id]
      );
      // We should also update the reconciliation_items review_status
      await query(
        `UPDATE reconciliation_items SET review_status = $1 WHERE ledger_transaction_id = $2`,
        [review_status, transaction_id]
      );
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
