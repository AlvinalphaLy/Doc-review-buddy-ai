import { ClauseExtractionAgent } from './agents/ClauseExtractionAgent';
import { ComplianceAgent } from './agents/ComplianceAgent';

export { ClauseExtractionAgent, ComplianceAgent };

type Env = {
	CLAUSE_AGENT: DurableObjectNamespace;
	COMPLIANCE_AGENT: DurableObjectNamespace;
	ALLOWED_ORIGINS: string;
};

function cors(origin: string | null, allowed: string[]) {
	const o = origin && allowed.includes(origin) ? origin : allowed[0] || '*';
	return {
		'Access-Control-Allow-Origin': o,
		'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Credentials': 'true',
		Vary: 'Origin',
	};
}

function json(data: unknown, origin: string | null, allowed: string[]) {
	return new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json', ...cors(origin, allowed) },
	});
}

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const origin = req.headers.get('Origin');
		const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());

		if (req.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: cors(origin, allowed) });
		}

		const url = new URL(req.url);
		const parts = url.pathname.split('/').filter(Boolean);

		// GET /health
		if (req.method === 'GET' && parts[0] === 'health') {
			return json({ ok: true }, origin, allowed);
		}

		// POST /doc/create -> { docId }
		if (req.method === 'POST' && parts[0] === 'doc' && parts[1] === 'create') {
			const docId = crypto.randomUUID();
			return json({ docId }, origin, allowed);
		}

		// POST /doc/:docId/text  body: { text: string }
		if (req.method === 'POST' && parts[0] === 'doc' && parts[2] === 'text') {
			const docId = parts[1];
			const body = await req.json().catch(() => ({}) as any);
			if (!body.text) return json({ error: 'Missing text' }, origin, allowed);

			const clauseStub = env.CLAUSE_AGENT.get(env.CLAUSE_AGENT.idFromName(docId));
			const res = await clauseStub.fetch('https://agent/upsertText', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: body.text }),
			});

			if (!res.ok) return json({ error: 'Failed to store text' }, origin, allowed);
			return json({ ok: true }, origin, allowed);
		}

		// POST /doc/:docId/run
		if (req.method === 'POST' && parts[0] === 'doc' && parts[2] === 'run') {
			const docId = parts[1];

			const clauseStub = env.CLAUSE_AGENT.get(env.CLAUSE_AGENT.idFromName(docId));
			const complianceStub = env.COMPLIANCE_AGENT.get(env.COMPLIANCE_AGENT.idFromName(docId));

			// Extract clauses
			const ex = await clauseStub.fetch('https://agent/extractClauses', { method: 'POST' });
			if (!ex.ok) return json({ error: 'Clause extraction failed' }, origin, allowed);

			// Get clauses
			const gc = await clauseStub.fetch('https://agent/getClauses', { method: 'POST' });
			if (!gc.ok) return json({ error: 'Get clauses failed' }, origin, allowed);
			const clauses = await gc.json();

			// Run compliance
			const rc = await complianceStub.fetch('https://agent/runCompliance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clauses }),
			});
			if (!rc.ok) return json({ error: 'Compliance failed' }, origin, allowed);

			const out = await rc.json();
			return json({ ok: true, ...out }, origin, allowed);
		}

		// GET /doc/:docId/results
		if (req.method === 'GET' && parts[0] === 'doc' && parts[2] === 'results') {
			const docId = parts[1];
			const complianceStub = env.COMPLIANCE_AGENT.get(env.COMPLIANCE_AGENT.idFromName(docId));

			const rr = await complianceStub.fetch('https://agent/getResults', { method: 'POST' });
			if (!rr.ok) return json({ error: 'Results failed' }, origin, allowed);

			const data = await rr.json();
			return json({ docId, ...data }, origin, allowed);
		}

		return new Response('Not Found', { status: 404 });
	},
};
