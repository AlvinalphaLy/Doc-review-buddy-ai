import { Agent, callable } from 'agents';

export type Finding = {
	id: string;
	severity: 'low' | 'medium' | 'high';
	title: string;
	explanation: string;
	clauseId: string;
	riskScore: number;
};

export class ComplianceAgent extends Agent {
	private inited = false;

	private init() {
		if (this.inited) return;
		this.inited = true;

		this.sql`CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      severity TEXT,
      title TEXT,
      explanation TEXT,
      clauseId TEXT,
      riskScore INTEGER
    )`;

		this.sql`CREATE TABLE IF NOT EXISTS meta (
      id TEXT PRIMARY KEY,
      status TEXT,
      riskScore INTEGER
    )`;

		this.sql`INSERT OR IGNORE INTO meta (id, status, riskScore)
             VALUES ('meta', 'idle', 0)`;
	}

	@callable()
	async runCompliance(clauses: Array<{ id: string; text: string }>) {
		this.init();

		this.sql`UPDATE meta SET status='processing', riskScore=0 WHERE id='meta'`;
		this.sql`DELETE FROM findings`;

		const findings: Finding[] = [];

		for (const c of clauses || []) {
			const t = (c.text || '').toLowerCase();

			// MVP heuristic rules (free)
			if (t.includes('terminate') && (t.includes('for convenience') || t.includes('at any time'))) {
				findings.push({
					id: crypto.randomUUID(),
					severity: 'high',
					title: 'Unilateral termination',
					explanation:
						'This allows termination without cause. Consider adding a notice period, limiting termination for convenience, and adding cure rights.',
					clauseId: c.id,
					riskScore: 30,
				});
			}

			if (t.includes('indemnify') && (t.includes('any and all') || t.includes('all claims'))) {
				findings.push({
					id: crypto.randomUUID(),
					severity: 'medium',
					title: 'Broad indemnity',
					explanation: 'Indemnity appears broad. Consider narrowing scope, adding caps, and excluding consequential damages.',
					clauseId: c.id,
					riskScore: 12,
				});
			}

			if (t.includes('limitation of liability') && t.includes('unlimited')) {
				findings.push({
					id: crypto.randomUUID(),
					severity: 'high',
					title: 'Unlimited liability',
					explanation: 'Unlimited liability is high risk. Consider adding a liability cap tied to fees paid or insurance limits.',
					clauseId: c.id,
					riskScore: 30,
				});
			}

			if (t.includes('confidential') && t.includes('perpetual')) {
				findings.push({
					id: crypto.randomUUID(),
					severity: 'low',
					title: 'Perpetual confidentiality',
					explanation:
						'Perpetual confidentiality can be hard to comply with. Consider time-limiting confidentiality except for trade secrets.',
					clauseId: c.id,
					riskScore: 5,
				});
			}
		}

		let total = 0;
		for (const f of findings) {
			total += f.riskScore;
			this.sql`INSERT INTO findings (id, severity, title, explanation, clauseId, riskScore)
               VALUES (${f.id}, ${f.severity}, ${f.title}, ${f.explanation}, ${f.clauseId}, ${f.riskScore})`;
		}

		const riskScore = Math.min(100, total);
		this.sql`UPDATE meta SET status='done', riskScore=${riskScore} WHERE id='meta'`;

		return { findingsCount: findings.length, riskScore };
	}

	@callable()
	async getResults() {
		this.init();

		const metaRows = this.sql`SELECT status, riskScore FROM meta WHERE id='meta'` as any[];
		const meta = metaRows?.[0];

		const findings = this.sql`
      SELECT id, severity, title, explanation, clauseId, riskScore FROM findings
    ` as any[];

		return {
			status: meta?.status ?? 'idle',
			risk: { score: meta?.riskScore ?? 0, breakdown: {} },
			findings,
		};
	}

	// Durable Object fetch router
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

		if (path === '/runCompliance') return Response.json(await this.runCompliance(body.clauses || []));
		if (path === '/getResults') return Response.json(await this.getResults());

		return new Response('Not found', { status: 404 });
	}
}
