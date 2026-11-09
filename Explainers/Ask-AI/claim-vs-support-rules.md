# THPS Claim vs. Support Rules Master Document

This document serves as the strict, deterministic framework for auditing Tom Hendrick Public Speaking (THPS) website assets. When an AI is instructed to perform a "Claim vs. Support Audit" using this document and the provided website context files, it must extract the claims, categorize them, evaluate the supporting evidence against the strict E-E-A-T hierarchy below, and output a standardized Markdown table. 

## 1.0 Claim Categorization (The E-E-A-T Weighting Approach)
Every extracted claim must be assigned to one of the following categories to determine the burden of proof required:

*   **Comparative Claims:** Statements asserting dominance or superiority (e.g., "Best," "Premier," "Top-Rated," "Industry Leader"). 
    *   *Required Proof:* Requires external, third-party consensus (Tier 1).
*   **Temporal & Result Claims:** Statements guaranteeing specific outcomes or timelines (e.g., "Transform in 4 weeks," "Eliminate stage fright"). 
    *   *Required Proof:* Requires specific, documented case studies with before-and-after data (Tier 2).
*   **Scientific & Metric Claims:** Statements defining biological, psychological, or mathematical standards (e.g., "130-150 WPM is the ideal pace," "The amygdala triggers Skill Inhibition"). 
    *   *Required Proof:* Requires cited research, aggregated database proof, or structured semantic definitions (Tier 2 or Tier 3).
*   **Product & Feature Claims:** Statements declaring functional capabilities (e.g., "The Mic-Check App tracks WPM in real-time"). 
    *   *Required Proof:* Requires functional UI proof, explicit JSON-LD feature mapping, or interactive demos (Tier 3 or Tier 4).

## 2.0 Evidence Hierarchy
Supporting evidence is strictly ranked by its SEO and AIO (AI Overview) value. The AI must identify the highest tier of evidence currently supporting a claim.

*   **Tier 1: Dynamic Third-Party Validation (Highest Value)** — Live API reviews, embedded YouTube iframes of actual verified sessions, or external links to recognized authorities (e.g., Yoodli awards).
*   **Tier 2: Specific Data-Backed Proof** — Detailed case studies with before/after metrics (e.g., "197 WPM down to 112 WPM"), named clients, and annotated historical progress graphs.
*   **Tier 3: Explanatory Semantic Schemas** — `FAQPage`, `DefinedTerm`, or `SoftwareApplication` JSON-LD structured data that explicitly feeds the concept directly into the Knowledge Graph.
*   **Tier 4: Static Internal Visuals** — Screenshots of the app UI, alt-text matched coaching photos, or internal generic graphics.
*   **Tier 5: Unsupported Internal Copy (Lowest Value)** — Claiming something is true in standard paragraph text without external links, schemas, media, or data backing it up.

## 3.0 Audit Scoring Rules & Anti-Hallucination Guardrails
When scoring the relationship between a claim and its support, the AI must strictly adhere to the following guardrail: **If the evidence (alt-text, JSON-LD schema, external link, or explicit data) does not exist explicitly within the provided `website-context-detailed.md` or `website-context-architecture.md` files, it must be scored as Non-Existent. The AI must never assume evidence exists just because the brand is authoritative.**

*   **Excellent:** The claim is supported by perfectly matched Tier 1 or Tier 2 evidence.
*   **OK:** The claim is supported by acceptable but lower-value Tier 3 or Tier 4 evidence.
*   **Irrelevant:** Evidence exists on the page, but it supports a completely different claim (e.g., claiming to be the "best coach" but the supporting image is just a software UI).
*   **Non-Existent:** No supporting evidence is found within the provided context files for that specific claim.
*   **Harmful:** The evidence on the page actively contradicts the claim (e.g., claiming to be an "online" coach, but the image alt-text describes an "in-person boardroom").

## 4.0 Required Output Format
The final output of any Claim vs. Support Audit must be a single, comprehensive Markdown table utilizing the exact columns below. The AI must evaluate the primary claims found in the provided context files and provide specific, actionable recommendations to elevate the support to "Excellent."

| Claim Extracted | Target Page | Claim Category | Required Support | Actual Support Found | Rating | AI Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *[Exact quote or paraphrase]* | *[URL or file path]* | *[From Section 1.0]* | *[Target Tier]* | *[What actually exists in the .md files]* | *[From Section 3.0]* | *[Specific asset or schema to add/change]* |
