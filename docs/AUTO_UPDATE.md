# Keeping RiftIntel patch data current (free)

## What updates how

| Data | Who updates it | AI? |
|------|----------------|-----|
| New patch structure (numbers, champs, items) | **GitHub Actions** every 4h (and when you run local) | No |
| Gameplay blurbs / nicer summaries | **Your PC + Ollama** | Yes, free |
| Dmg calc champion list/items | Build-time Meraki/Data Dragon fetch | No AI |
| Current champion kit | Production build → Meraki/Riot public data → same-origin static JSON | No AI |

If your PC is **off**, the site still gets **new patches** from Actions (heuristic summaries).  
When the PC is **on**, local update **fills in Ollama** for any `aiEnriched: false` patches and pushes again.

## Setup once

### 1. GitHub + Vercel

- Repo is on GitHub; Vercel deploys on push to `master`/`main`.
- Actions need `contents: write` (workflow already sets this for `GITHUB_TOKEN`).

### 2. Local Ollama path (Windows)

1. Install [Ollama](https://ollama.com) and pull a model, e.g. `ollama pull llama3.1:8b`.
2. From the repo:

```powershell
# Dry run (no push)
python scripts/auto/local_update.py

# Full: ingest + AI enrich + commit + push
python scripts/auto/local_update.py --push
```

3. **Task Scheduler** (recommended while developing / patch weeks):

- Program: `python`  
- Arguments: `C:\Users\rhazz\Documents\patchlens\scripts\auto\local_update.py --push`  
- Start in: `C:\Users\rhazz\Documents\patchlens`  
- Trigger: every **30–60 minutes**, or every 15 minutes on known patch days.

Leave **Ollama running** for AI. If it’s down, the script still ingests structure; AI waits for the next successful run.

### 3. Manual AI-only enrich

```powershell
# Ollama must be up
python scripts/ingest/enrich_ai.py
git add src/data
git commit -m "data: Ollama enrich pending patches"
git push
```

## Patch schedule — when to have the PC on

Riot usually publishes a **season / mid-season schedule** and **patch notes 0–1 days before** the live deploy.

| Source | Reliability | What you get |
|--------|-------------|--------------|
| [League patch schedule / support articles](https://support-leagueoflegends.riotgames.com/) | High for **week** | Ship weekdays (often Tue/Wed depending on region & season) |
| [Riot patch notes site](https://www.leagueoflegends.com/en-us/news/tags/patch-notes/) | High for **notes live** | Notes often drop **day before** or **morning of** deploy |
| [Wiki “next” / `Vxx.yy` page](https://wiki.leagueoflegends.com/) | High once page exists | Same source our ingest uses |
| Social / dev blogs | Medium | Heads-up that notes are imminent |

**Important:**

- **Schedule date** ≈ when the patch hits live servers.  
- **Notes** often appear **earlier the same week** (commonly the day before).  
- Our automation keys off the **wiki notes page**, not the game client.

So: you don’t need the PC on the exact second of deploy — **on for the notes day + next morning** is enough if Actions already ingested structure overnight.

## Quality gate

Newly ingested patch data is untrusted until it passes the candidate publication
gate. The full archive audit intentionally reports older entries still under
review. Files with missing,
contradictory, or structurally invalid changes must remain quarantined rather
than appearing in comparisons. AI enrichment can improve explanations, but it
must never invent or repair numeric patch facts.

## Commands cheat sheet

```bash
# Cloud-style (no AI) — same as Actions
python scripts/ingest/run_ingest.py --years 0.5 --only-new --fail-on-quarantine

# Local full loop
python scripts/auto/local_update.py --push

# AI polish only
python scripts/ingest/enrich_ai.py
```

## Cost

- GitHub Actions: free tier (public repo is easiest).  
- Ollama: free on your hardware.  
- Hosting: use a free, noncommercial beta only while validating demand; choose
  a documented commercial hosting path before enabling revenue.
- No paid LLM APIs required.
