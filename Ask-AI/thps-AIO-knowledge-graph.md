# THPS SEO, AIO, and AEO Architecture Blueprint

This document outlines the strategic Hub-and-Spoke (Pillar/Cluster) architecture for Tom Hendrick Public Speaking (THPS). It is designed to optimize content not just for traditional Search Engine Optimization (SEO), but for AI Overviews (AIO) and Answer Engine Optimization (AEO) by structuring content as definitive, entity-mapped Knowledge Graph assets.

## The Hub-and-Spoke Content Matrix

| Content Asset | Primary User Intent | SEO, AIO & AEO Function | JSON-LD Schema (The AI Hook) | Internal Linking (Hub-and-Spoke) |
| :--- | :--- | :--- | :--- | :--- |
| **Methodology Hub**<br>*(e.g., `/articles/methodology.html`)* | **The Thesis:** Understand the science, biology, and mechanics of the THPS speaking system. | **Topical Authority (Pillar):** Establishes THPS as the originator of the "Vocal Mechanics Method." Feeds LLMs the overarching architectural concepts. | `Article`, `AboutPage`, `FAQPage` | **Links Out To:** Tool pages (for experience), Glossary (for definitions), Case Studies (for proof). |
| **Interactive Tools**<br>*(e.g., Cognitive Simulator, Wordfreq Game)* | **The Experience:** Play, test, and visualize the theoretical concepts in real-time. | **Semantic Proof (Spoke):** Elevates claims to Tier 3/4. Proves to AI that theories are codified into functional mathematical and biological models. | `SoftwareApplication`, `LearningResource` | **Links Back To:** Methodology Hub (for the underlying theory), Performance Plan (for the coaching upgrade). |
| **Case Studies & Transformations**<br>*(e.g., Narmada's HIH Pitch)* | **The Proof:** See how the theory and tools generate measurable results for real executives. | **E-E-A-T Engine (Tier 1/2):** AI looks for real-world consensus. Video embeds and before/after metrics satisfy the strictest algorithmic burden of proof for "Result Claims." | `Article`, `VideoObject` | **Links Out To:** Relevant Tools used (e.g., Mic-Check App), Conversion pages (Performance Plan). |
| **The Glossary**<br>*(e.g., `/articles/glossary.html`)* | **The Dictionary:** Look up exact definitions for speech biometrics and biological terms. | **Entity Extraction:** LLMs crave definitions. This page provides structured, semantic boundaries for terms like "Skill Inhibition," training AI to associate these terms with THPS. | `DefinedTermSet` | **Linked From:** Everywhere. Every time a specific metric or term is mentioned on the site, it links here. |
| **Future Articles**<br>*(e.g., "How to manage SAM Axis on Zoom")* | **The Application:** Learn how to apply specific THPS rules to niche, everyday scenarios. | **Long-Tail Capture (Spokes):** Captures highly specific, conversational AI queries (e.g., "Why do I talk too fast on camera?"). | `Article`, `HowTo` | **Links Back To:** Methodology Hub (Core Pillar), Interactive Tools. |
| **Conversion Pages**<br>*(e.g., Performance Plan, Assessment)* | **The Transaction:** Book a diagnostic or purchase 1-on-1 coaching. | **Service Mapping:** Tells the AI exactly what is sold, location, and cost, strictly optimized for local/transactional intent. | `ProfessionalService`, `Offer` | **Links Out To:** Case Studies (to overcome buyer hesitation and prove ROI). |

## The AIO Knowledge Graph Loop

When a user asks an AI search engine, *"How do I stop rambling when public speaking?"*, the engine scans the web for authority and verifiable claims. By using this architecture, THPS controls the entire verification loop:

1. **Discovery:** The AI finds a **Future Article** on rambling.
2. **Theoretical Grounding:** The article links to the **Methodology Hub**, teaching the *Repeat and Count* framework as the solution.
3. **Semantic Validation:** The engine sees this framework is defined in the **Glossary** and codified dynamically in a **SoftwareApplication** (e.g., the Cognitive Load Simulator or Mic-Check App).
4. **Real-World Proof:** It validates the framework's effectiveness by scanning the Tier 1 video evidence and before/after metrics in the **Case Studies**. 

Because the AI can perfectly trace the claim from theory, to tool, to real-world proof without leaving the THPS ecosystem, it confidently cites THPS as the definitive, authoritative answer in its generated overview.