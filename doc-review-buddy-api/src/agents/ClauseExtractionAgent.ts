import { Agent, callable } from 'agents';

export type Clause = {
	id: string;
	text: string;
	page?: number;
	startOffset?: number;
	endOffset?: number;
};

export class ClauseExtractionAgent extends Agent {
	private inited = false;

	private init() {
		if (this.inited) return;
		this.inited = true;

		this.sql`CREATE TABLE IF NOT EXISTS doc (
      id TEXT PRIMARY KEY,
      text TEXT
    )`;

		this.sql`CREATE TABLE IF NOT EXISTS clauses (
      id TEXT PRIMARY KEY,
      text TEXT,
      page INTEGER,
      startOffset INTEGER,
      endOffset INTEGER
    )`;
	}

	@callable()
	async upsertText(text: string) {
		this.init();
		const safeText = typeof text === 'string' ? text : '';
		this.sql`INSERT OR REPLACE INTO doc (id, text) VALUES ('doc', ${safeText})`;
		return { ok: true };
	}

	@callable()
	async extractClauses() {
		this.init();

		// In your runtime, SELECT returns an array of rows directly
		const rows = this.sql`SELECT text FROM doc WHERE id='doc'` as any[];
		const text = (rows?.[0]?.text ?? '') as string;

		const parts = text
			.split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/g) // blank lines or sentence boundary before capital
			.map((s) => s.trim())
			.filter(Boolean)
			.slice(0, 250); // safety cap

		this.sql`DELETE FROM clauses`;

		for (const t of parts) {
			const id = crypto.randomUUID();
			this.sql`INSERT INTO clauses (id, text, page, startOffset, endOffset)
               VALUES (${id}, ${t}, NULL, NULL, NULL)`;
		}

		return { clausesCount: parts.length };
	}

	@callable()
	async getClauses(): Promise<Clause[]> {
		this.init();

		const results = this.sql`
      SELECT id, text, page, startOffset, endOffset FROM clauses
    ` as any[];

		return results.map((r) => ({
			id: r.id,
			text: r.text,
			page: r.page ?? undefined,
			startOffset: r.startOffset ?? undefined,
			endOffset: r.endOffset ?? undefined,
		}));
	}

	// Durable Object fetch router (Worker calls these endpoints)
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		let body: any = {};
		if (request.method === 'POST') {
			const ct = request.headers.get('Content-Type') || '';
			if (ct.includes('application/json')) {
				body = await request.json().catch(() => ({}));
			}
		}

		if (path === '/upsertText') return Response.json(await this.upsertText(body.text));
		if (path === '/extractClauses') return Response.json(await this.extractClauses());
		if (path === '/getClauses') return Response.json(await this.getClauses());

		return new Response('Not found', { status: 404 });
	}
}
