# What Gets Wet — R4 Demo Target V4

**Working target for Matt Henderson + Anthony Gould**  
**Purpose:** Prepare the R4 demo as one flexible, evidence-backed engineering story that demonstrates the larger **Context is Your IP** thesis.  
**Format:** Live narration over short, local pre-recorded Nextspace video vignettes.  
**Experience principle:** The presenters drive the experience; the timeline does not drive the presenters.

## 1. The job of the demo

This is **not** a digital-twin feature tour.

The digital twin is valuable because it makes shared context visible. It lets the audience see places, infrastructure, modeled conditions, evidence, relationships, and consequences in one environment.

The story should prove:

> **When important organizational meaning is modeled as reusable context, AI can do more than retrieve information. It can reason across explicit relationships, show evidence, preserve boundaries, and support better decisions.**

The demo should feel like **one Anchor QEA engineering story**, not a sequence of AI-Ready Data proof points.

The audience should leave with three ideas:

1. **Ask is the surface. Context is the asset.**
2. **The same maintained context can support people, analytics, AI, twins, and future workflows.**
3. **The more consequential the decision, the more important it is to externalize identity, relationships, evidence, rules, and boundaries instead of asking the model to reconstruct them each time.**

## 2. Experience design

Use local video vignettes, not one long recording.

Each vignette should begin already oriented, perform one meaningful interaction, reach one proof point, and finish on a still frame that can hold indefinitely while Matt or Anthony speaks. Avoid menu hunting, spinners, browser chrome, and low-value setup.

The presenter should be able to pause, reopen the vignette chooser, replay a clip, skip an optional vignette, or jump directly to another question.

**Core path:** roughly 6.5–7.5 minutes after Matt's opening.  
**Optional depth:** Tweed, clinic BIM, and observed NOAA evidence can extend the demo when the room is engaged.

# 3. Target story

## LIVE OPEN — WHY

**Target:** ~1:15–1:45  
**Media:** strongest WGW / coastal / infrastructure still.

### Matt

> Anchor QEA helps clients make decisions about complex environmental and infrastructure systems. Our work brings together science, engineering, models, field observations, reports, and knowledge of the physical site.
>
> One question sounds incredibly simple: **if this event happens, what gets wet?**
>
> But the answer is rarely in one system. It depends on water, terrain, time, structures, infrastructure, evidence, and the relationships among them.
>
> That is the idea behind What Gets Wet.

### Purpose
Earn the room before showing software. Make the problem an engineering and decision problem, not a visualization problem.

## VIGNETTE — WHAT MIGHT HAPPEN?

**Launcher title:** **What might happen?**  
**Expected clip:** ~20–30 sec

### Screen
- Start directly in the hydrodynamic / Event Impact experience.
- Show the selected scenario.
- Move through event time: start → rising → peak → recession.
- Let buildings / exposure change with modeled water rather than showing only "what ever got wet."
- End at the strongest peak or consequence frame.

### Matt

> This is AQ's hydrodynamic representation of the event.
>
> It is not simply a flood layer. It represents a scenario changing through time, and we can see how that modeled condition begins to intersect the physical world.
>
> But this is still a **model**. It is not an observation, and it is not yet consequence.

### Proof
The context includes scenario, geography, water surface, time, and physical assets. Evidence type matters.

## VIGNETTE — WHAT ELSE IS AFFECTED?

**Launcher title:** **What else is affected?**  
**Expected clip:** ~20–35 sec

### Screen
Use the Branford service-area story:
- start with modeled exposure;
- reveal the treatment facility;
- reveal the connected service-area polygon;
- reveal the buildings associated with that service area;
- if useful, toggle between Sandy / 100-year / 100-year + SLR without turning this into a controls tour.

### Matt

> The hydro model can tell us where modeled water is.
>
> The more consequential question is: **what do the exposed things do, and what else depends on them?**
>
> Here we have a treatment facility connected to a service area, and that service area connects to the buildings that depend on the service.
>
> Exposure is not the same as impact. **Impact depends on relationships.**

### Anthony — optional callback

> This is the shift from holding records to representing a connected world.

### Guardrail for Monday
Confirm the facility terminology and consequence:
- Is the Branford entity a drinking-water facility, wastewater facility, or another treatment asset?
- What exactly does the service-area polygon represent?
- Ensure the Ask wording and downstream consequence use the same domain truth.

## VIGNETTE — CAN THE SYSTEM EXPLAIN WHY?

**Launcher title:** **Can the system explain why?**  
**Expected clip:** ~35–55 sec plus answer hold

This is the principal AI-Ready Data proof.

### Frame the UI before asking

Matt:

> You are going to see this through a conversational interface because it is an easy way to interrogate the system.
>
> **But the chat is not the important part. The important part is the shared representation of the world underneath it.**

### Question 1 — preferred wording

> **What is the modeled flood exposure across the Branford treatment-plant service area, and what could be affected if that service is disrupted?**

If scenario context is not visually obvious, include the scenario in the question.

### What to emphasize

Do **not** read the response.

Matt:

> Look at what happened here.
>
> It resolved the service area and the buildings connected to it.
>
> It quantified modeled exposure.
>
> It reasoned about a possible expanded service consequence.
>
> But it also refused to claim that the plant itself is flooded or offline, because the available evidence does not establish that.
>
> **That boundary matters as much as the answer.**

### Why this matters
The answer should distinguish modeled exposure, derived counts, explicit connected relationships, possible consequence, and unsupported claims. Celebrate restraint, not just fluency.

## CONTINUATION — WHAT DOES AQ KNOW?

This should feel like a natural follow-up in the **same conversation**, not a second chatbot demonstration.

**Launcher title if separately recorded:** **What does AQ know?**

### Question 2

> **What does Anchor QEA recommend we consider for mitigation and continuity planning?**

### Matt

> Now we have crossed another evidence boundary.
>
> The first answer was grounded largely in the modeled world and the connected service area.
>
> This answer is also drawing from AQ's documented engineering knowledge.
>
> And notice the boundary again: recommendations written for another geography still need to be adapted and engineering-validated before we apply them here.

### Purpose
Show that structured/model context and unstructured expert knowledge can participate in the same reasoning experience without pretending they are the same evidence type.

## VIGNETTE — SHOW ME HOW YOU KNOW

**Launcher title:** **Show me how you know**  
**Expected clip:** ~20–35 sec  
**Status:** depends on what Nextspace can expose cleanly before R4.

### Screen
Show the best available evidence/context trace. Ideally distinguish:
- **MODELED** — hydrodynamic scenario / water surface
- **DERIVED** — exposure result / counts
- **CONNECTED** — facility → service area → buildings
- **EXPERT** — AQ report / planning material
- **OBSERVED** — optional NOAA evidence when geographically and analytically relevant

### Matt

> A fluent answer is easy.
>
> What matters is whether we can understand what contributed to it, which relationships were used, what kind of evidence each claim depends on, and where the evidence stops.

### Anthony

> We did not make this more trustworthy by giving the model a longer prompt.
>
> **We gave it a better representation of the world it is reasoning about.**

### NOAA / buoy guidance
The available observed station is southwest of New Haven. Do not imply that it validates modeled water at Branford, Tweed, or any individual building. It is an optional evidence type, not a required chapter.

## VIGNETTE — CAN THE CONTEXT BE REUSED?

**Launcher title:** **Can the context be reused?**  
**Expected clip:** ~15–25 sec

### Screen
Return from Ask to the twin / map using the same canonical plant, service area, buildings, spatial entities, and scenario context. A truthful edited handoff is fine if Ask cannot directly select the entities in the twin.

### Matt

> The answer has not created a separate AI-only world.
>
> These are the same places and relationships that the engineer can explore in the twin.

### Anthony

> **Ask is just one surface. The context is the asset.**
>
> The same canonical places, assets, relationships, and evidence can support the twin, analytics, other AI experiences, and eventually operational workflows.

# 4. Optional depth vignettes

## OPTIONAL — PAST, PRESENT, PLANNED: TWEED

**Launcher title:** **What changed over time?**  
**Expected clip:** ~25–40 sec

### Job
Show that shared context can connect **historical evidence, today's physical world, and a planned future state**. This is not another flood example.

### Screen
Ideal sequence:
1. current Tweed 3D / photorealistic view;
2. a geolocated historical flood / storm photo;
3. modeled event context;
4. planned airport / future rendering or documented future-state artifact, if available and licensed for internal use.

### Matt

> A maintained model of the world also has to deal with time.
>
> Here we can connect historical evidence, the airport that exists today, the modeled event, and ultimately the infrastructure being planned for the future.
>
> Those are different representations of the same place, with different evidence behind each.

### Anthony

> Shared context becomes much more valuable when it can represent not just **what is**, but **what was, what is planned, and the evidence behind each.**

### Research task
Before final recording, attach current authoritative Tweed planning documentation and renderings only after the sources and reuse rights are verified. The strongest question is not whether the plan is "enough," but:

> **What resilience measures are documented in the planned airport, and what evidence would we need to evaluate them against our modeled scenarios?**

## OPTIONAL — REGION TO BUILDING TO OPERATIONS: CLINIC BIM

**Launcher title:** **What is inside the building?**  
**Expected clip:** ~25–40 sec

### Job
Move from regional exposure into the owner/operator world.

> **Region → Site → Building → Space → System → Asset → Operational dependency**

This directly echoes the presentation's Site → Building → Asset → Process example.

### Matt

> At regional scale, we can identify that a facility is exposed.
>
> But an owner or operator needs another level of context.
>
> What is inside the building? Which systems are critical? Which equipment supports those systems? What function is lost if an asset becomes unavailable?

### Anthony

> This is where information created through AEC can extend into **operate**.
>
> The BIM is not valuable simply because it is detailed. It becomes valuable when the building model participates in the same maintained context as the site, the event, the evidence, and the operational dependencies.

# 5. Future-state ending — WHAT COULD WE CHANGE?

**Launcher title:** **What could we change?**  
**Expected clip:** ~20–30 sec or static concept sequence  
**Status:** conceptual future state unless AQ has produced the underlying science.

### Screen
**BASELINE** — known scenario, exposure, dependencies, evidence.  
**INTERVENTION** — AQ-designed candidate.  
**COMPARE** — rerun / reevaluate and compare resulting exposure and consequence.

### Matt

> This is where we want to take the experience next.
>
> Once we understand the system, its dependencies, and the evidence, an engineer can introduce a defensible intervention, rerun the analysis, and compare outcomes.
>
> The science and engineering judgment remain AQ's. The system gives us a way to connect the evidence, the model, the proposed change, and the resulting decision.

### Closing thought

> **Context allows AI not merely to describe the physical world — but eventually to participate in evaluating choices about it.**

# 6. Flexible run of show

| Moment | Target live time |
|---|---:|
| WHY — live opening | 1:15–1:45 |
| What might happen? | 0:45 |
| What else is affected? | 1:00 |
| Can the system explain why? + AQ follow-up | 2:00–2:30 |
| Show me how you know | 0:45 |
| Can the context be reused? | 0:45 |
| What could we change? | 0:45 |
| **Core total** | **~7:15–8:15** |

Optional depth:
- Tweed past / present / planned: +0:45
- Clinic BIM region to operations: +0:45
- Observed NOAA evidence: +0:30

# 7. Vignette launcher language

Recommended drawer title:

> **Context in Action**  
> *What Gets Wet · Anchor QEA + Slalom*

Recommended cards:
- **What might happen?** — Follow modeled water through time.
- **What else is affected?** — Trace exposure into services and dependencies.
- **Can the system explain why?** — Ask across model, relationships, evidence, and AQ knowledge.
- **Show me how you know** — Keep evidence types and boundaries visible.
- **Can the context be reused?** — Return to the same canonical places and assets.
- **What changed over time?** — Connect historical evidence to a planned future. *(optional)*
- **What is inside the building?** — Move from regional risk into systems and assets. *(optional)*
- **What could we change?** — Compare a future intervention with the baseline. *(future)*

These create curiosity without giving the answer away.

# 8. Production guidance

### Recording
- standardize every capture at the same 16:9 resolution and browser zoom;
- prefer 1920×1080 / 30 fps H.264 MP4;
- record without spoken narration;
- begin each clip with a brief clean hold;
- end each clip on a frame worth discussing for 20–60 seconds;
- keep the mouse away from the upper-left launcher region during final holds;
- remove loading waits and low-value navigation.

### Wrapper
The local HTML wrapper should:
- use a full-viewport video stage;
- place a 9-dot launcher directly over the recorded Nextspace 9-dot area;
- mask the recorded launcher so only one icon appears;
- pause the current clip when the drawer opens;
- open a dark left-side overlay drawer rather than pushing/resizing the video;
- load a selected vignette full-screen and start it after the click;
- freeze on the last frame when the clip ends;
- never auto-advance;
- provide subtle play/pause/restart controls;
- work fully offline.

### Presenter behavior
**PLAY → FREEZE → EXPLAIN → CHOOSE**

The presenter should never feel trapped by a timeline.

# 9. Monday discussion with Matt

1. Is the Branford facility/service-area relationship technically correct and described with the right water/wastewater terminology?
2. Is the expanded service consequence defensible?
3. Which parts of the Ask answer feel most valuable to a coastal engineer?
4. Is the AQ-document follow-up a fair use of the Four Shore material for Branford if the system clearly states the geographic limitation?
5. Does the Tweed past/present/planned vignette strengthen the engineering story?
6. What is the single most meaningful clinic/BIM dependency to show?
7. What evidence types does Matt most want the audience to see distinguished?
8. What future intervention can AQ defend as a conceptual mitigation example without inventing science for R4?
9. Which optional vignette should be the first to cut if the room or timing requires it?

# 10. Non-negotiable guardrails

- Do not imply modeled exposure proves observed flooding or damage.
- Do not imply a linked treatment facility is offline unless evidence supports it.
- Keep observed, modeled, derived, connected, expert, and inferred claims distinguishable.
- Do not imply the current pilot executes operational mitigation if it does not.
- Do not make the ontology or twin the hero.
- Do not make Ask the hero.
- **The hero is the reusable context that lets people and AI reason over the same world.**
