# PROMPTS.md

## AI Assistance Disclosure

This project was developed with the assistance of AI tools (e.g., ChatGPT) to accelerate development, debugging, and architectural design.  
Below is a record of representative prompts used during development.

---

## 1. Project Architecture

**Prompt:**

> Design a full-stack document review SaaS using Cloudflare Workers, Durable Objects, and a React frontend. The system should upload documents, extract clauses, assess compliance risk, and return structured findings.

---

## 2. Backend – Clause Extraction Agent

**Prompt:**

> Write a Cloudflare Durable Object agent that stores document text, segments it into clauses, and exposes callable methods for extraction and retrieval.

---

## 3. Backend – Compliance / Risk Analysis Agent

**Prompt:**

> Implement a compliance analysis agent that evaluates contract clauses for legal risk (e.g., unilateral termination, broad indemnity, unlimited liability) and outputs findings with severity and risk scores.

---

## 4. API Design

**Prompt:**

> Define REST-style endpoints for creating documents, uploading text, running analysis, and fetching results from Cloudflare Workers.

---

## 5. Frontend – Upload & Review Flow

**Prompt:**

> Build a React UI that allows users to upload documents, trigger backend analysis, and display risk summaries and findings.

---

## 6. PDF Viewer & Highlighting

**Prompt:**

> Implement a PDF viewer using PDF.js that supports zooming, pagination, and overlaying highlight rectangles for detected risk clauses.

---

## 7. Debugging & Error Resolution

**Prompt:**

> Diagnose and fix runtime errors related to Cloudflare Durable Object SQL usage, React state issues, and PDF.js loading errors.

---

## 8. UI / UX Improvements

**Prompt:**

> Improve the risk dashboard UI to clearly show overall risk score, severity breakdown, and categorized findings.

---

## Disclosure

All AI-generated suggestions were reviewed, adapted, and integrated manually by the developer.  
Final implementation decisions and code integration were performed by the project author.
