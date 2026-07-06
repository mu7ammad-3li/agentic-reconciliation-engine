import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    const agentsDir = path.resolve(process.cwd(), '../agents');
    
    // Command to run the actual AI agents
    const command = `uv run python main.py --account-id "56f59762-dd0a-4a11-8f7c-09f8a8fb27af" --csv-path "test_bank_statement.csv" --period-start "2020-01-01T00:00:00Z" --period-end "2030-01-01T00:00:00Z"`;
    
    // Fallback command in case the user doesn't have an API key configured yet (perfect for offline portfolio demos)
    const fallbackCommand = `uv run python mock_reconciliation.py`;

    let output = '';
    try {
      // Execute the real AI crew
      const { stdout } = await execPromise(command, { cwd: agentsDir });
      output = stdout;
    } catch (err: any) {
      // If it fails due to a missing API key, gracefully fallback to the mock script to keep the UI demo working
      if (err.message.includes('API_KEY is required') || err.message.includes('google_api_key')) {
        console.warn("No LLM API key found, gracefully falling back to mock script for UI demo...");
        const { stdout } = await execPromise(fallbackCommand, { cwd: agentsDir });
        output = stdout;
      } else {
        throw err;
      }
    }

    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
