# Framework Flowcharts

All major processes and workflows in diagram form. Start with the Stage + Mode tracker (the global position indicator), then the high-level lifecycle, then dedicated charts for each workflow area.

---

## 0 — Project Stage & Mode: Global State Tracker

**Stage** = which phase of the lifecycle the project is in.
**Mode** = what is operationally happening within that phase right now.

These two fields on the Project entity are the first thing any agent reads on cold-start. Together they determine what kind of work is permitted and where to look next.

### Stage Transitions

```mermaid
stateDiagram-v2
    [*] --> uninitialised : Project record created

    uninitialised --> phase_1 : Human initiates interview

    phase_1 --> phase_2 : Phase 1 PCR gate passed\n+ context reset

    phase_2 --> phase_3 : Phase 2 PCR gate passed\n+ context reset

    phase_3 --> phase_4 : Phase 3 PCR gate passed\n+ context reset

    phase_4 --> complete : All completion conditions met\n+ human confirms

    phase_1 --> abandoned : Human stops project
    phase_2 --> abandoned : Human stops project
    phase_3 --> abandoned : Human stops project
    phase_4 --> abandoned : Human stops project
    uninitialised --> abandoned : Human stops project

    phase_1 --> on_hold : Human pauses
    phase_2 --> on_hold : Human pauses
    phase_3 --> on_hold : Human pauses
    phase_4 --> on_hold : Human pauses

    on_hold --> phase_1 : Human resumes
    on_hold --> phase_2 : Human resumes
    on_hold --> phase_3 : Human resumes
    on_hold --> phase_4 : Human resumes

    complete --> [*]
    abandoned --> [*]
```

### Mode Transitions (overlays any Stage)

```mermaid
stateDiagram-v2
    [*] --> normal : Default mode for all Stages

    normal --> change_management : Change Request created
    change_management --> normal : CR approved (Scope Change applied)\nor CR rejected

    normal --> infeasibility_review : Phase 1 validation finds\npotential infeasibility
    infeasibility_review --> normal : Human decides to revise
    infeasibility_review --> abandoned : Human decides to stop

    normal --> phase_gate : Phase Completion Record written\nwith gate status = not_passed
    phase_gate --> normal : Gaps closed\ngate re-evaluated = passed

    normal --> awaiting_specialist : First Specialist Routing Blocker created
    awaiting_specialist --> normal : All Specialist Routing Blockers resolved
```

### Cold-Start Decision Table

What an agent does immediately after reading Stage + Mode:

| Stage | Mode | Agent's first action |
|---|---|---|
| `uninitialised` | `normal` | Begin Phase 1 interview |
| `phase_1` | `normal` | Continue interview — read last Session Log entry for Exact State |
| `phase_1` | `infeasibility_review` | Read Infeasibility Finding — await human decision |
| `phase_2` | `normal` | Continue planning — read last Session Log entry |
| `phase_2` | `phase_gate` | Read Phase 2 PCR — identify failed checklist items — return to planning |
| `phase_3` | `normal` | Continue decomposition — read last Session Log entry |
| `phase_3` | `phase_gate` | Read Phase 3 PCR — identify failed checklist items — return to decomposition |
| `phase_4` | `normal` | Read Session Log → Active Task → resume implementation loop |
| `phase_4` | `change_management` | Read open Change Request — do not start new tasks — assist with impact analysis |
| `phase_4` | `awaiting_specialist` | Read Blocked tasks — surface routing status to human — work non-Specialist tasks if available |
| `phase_4` | `phase_gate` | Read Phase 3 PCR for gate failures — surface to human (should not normally occur in Phase 4) |
| `any` | `normal` | `on_hold` Stage: read Session Log for hold reason — surface to human to decide whether to resume |
| `complete` | `normal` | Read Project Completion Record — project is done |
| `abandoned` | `normal` | Read Abandonment Record — project is stopped |

---

## 1 — High-Level Project Lifecycle

```mermaid
flowchart TD
    START([Project Initiated]) --> P1

    subgraph P1["Phase 1 · Project Interview"]
        P1A[Human describes project] --> P1B[Iterative interview\none question at a time]
        P1B --> P1C{Existing\ncodebase?}
        P1C -- Yes --> P1D[Onboarding variant:\nIngest code · surface decisions\nreverse-engineer contracts · log risks]
        P1C -- No --> P1E[Standard flow]
        P1D --> P1E
        P1E --> P1F[Validation pass:\nconflicts · gaps · feasibility]
        P1F --> P1G{Project\nfeasible?}
        P1G -- No --> P1H[Infeasibility Finding\nproduced]
        P1H --> P1I{Human\ndecision}
        P1I -- Revise --> P1B
        P1I -- Stop --> ABANDONED([Project Abandoned])
        P1G -- Yes --> P1J[Entities written in real time:\nProject · Goals · Resources\nDecisions · Questions · Risks]
    end

    P1J --> PCR1{Phase 1\nCompletion Record\ngate passed?}
    PCR1 -- No --> P1J
    PCR1 -- Yes --> RESET1[Context Reset]
    RESET1 --> P2

    subgraph P2["Phase 2 · Epic & Milestone Planning"]
        P2A[Read Phase 1 output] --> P2B[Propose Epics\nincl. Infrastructure Epics]
        P2B --> P2C[Human reviews\nadjusts scope-in · scope-out]
        P2C --> P2D[Define Epic Dependencies\nhard · soft · gate conditions]
        P2D --> P2E[Define Milestones\nwith Exit Criteria]
        P2E --> P2F[Map Goals → Epics\ncheck every Goal covered]
        P2F --> P2G[Update Risk Register]
    end

    P2G --> PCR2{Phase 2\nCompletion Record\ngate passed?}
    PCR2 -- No --> P2F
    PCR2 -- Yes --> RESET2[Context Reset]
    RESET2 --> P3

    subgraph P3["Phase 3 · Task Research & Decomposition"]
        P3A[Read Phase 2 output] --> P3B[One Epic at a time\nper planned order]
        P3B --> P3C[Propose task list\nHuman reviews]
        P3C --> P3D[Research each task\nwrite Context + Research Date]
        P3D --> P3E[Define Pattern Contracts\nsubtasks · acceptance criteria\npre-populate Verifications]
        P3E --> P3F[Map Dependencies\nTask + Epic level]
        P3F --> P3G[Log Risks from research]
        P3G --> P3H{More Epics?}
        P3H -- Yes --> P3B
        P3H -- No --> P3I[Resolve or record\nall open Questions]
    end

    P3I --> PCR3{Phase 3\nCompletion Record\ngate passed?}
    PCR3 -- No --> P3I
    PCR3 -- Yes --> RESET3[Context Reset]
    RESET3 --> P4

    subgraph P4["Phase 4 · Implementation"]
        P4A[Bootstrap sequence\nsee Flow 5] --> P4B[Implementation Loop\nsee Flow 5]
        P4B --> P4C{All tasks\nDone?}
        P4C -- No --> P4B
        P4C -- Yes --> P4D[Epic Completion checks]
        P4D --> P4E[Milestone Completion checks]
        P4E --> P4F[Goal Completion checks]
        P4F --> P4G{Project\ncompletion\ncondition met?}
        P4G -- No --> P4B
        P4G -- Yes --> P4H[Human confirms\nProject Completion]
    end

    P4H --> COMPLETE([Project Complete\nProject Completion Record written])
```

---

## 2 — Phase 1: Interview Detail

```mermaid
flowchart TD
    ENTRY([Phase 4 agent reads\nPhase 3 Completion Record]) --> GATE{Gate\npassed?}
    GATE -- No --> STOP1([Surface gaps to human\nReturn to Phase 3])
    GATE -- Yes --> CHK[Read most recent Session Log\nconfirm no Active Task]
    CHK --> READ[Read Project entity\nGoals · Constraints]
    READ --> EPICS[Read all Epic entities\nget task tables]
    EPICS --> SELECT[Select first Task:\nhighest-priority Pending\nearliestEpic with Epic Dependencies satisfied\nno Blockers · no Needs Review\nall hard Task Dependencies satisfied]
    SELECT --> LOAD[Load Task fully:\nContext · Subtasks · Pattern Dependencies\nAffected Files · Verifications]
    LOAD --> STALE{Context\nstale?}
    STALE -- "Research Date > 60 days\nor stack version changed" --> REVERIFY[Create Research Verification attempt\nconfirm approach still valid]
    REVERIFY --> VALID{Still\nvalid?}
    VALID -- No --> UPDATE[Update Task Context\nnew Research Date]
    VALID -- Yes --> LOG
    UPDATE --> LOG
    STALE -- No --> LOG
    LOG[Write first Phase 4\nSession Log entry] --> BEGIN([Begin execution\nFlow 5 Implementation Loop])
```

---

## 3 — Phase 2: Planning Detail

```mermaid
flowchart TD
    ENTRY([Agent opens interview]) --> OPEN["Single opening question:\nTell me what you want to build"]
    OPEN --> EXISTING{Existing\ncodebase?}

    EXISTING -- Yes --> OB1[Ingest codebase structure]
    OB1 --> OB2[Reverse-engineer:\nRepository Map · Tech Stack Entries\nConventions · Pattern Contracts]
    OB2 --> OB3[Surface existing decisions\nas Decision records]
    OB3 --> OB4[Log technical debt\nas Risk records]
    OB4 --> OB5[Conflict check:\nexisting patterns vs Goals/Constraints]
    OB5 --> OB6{Conflicts\nfound?}
    OB6 -- Yes --> OB7[Create Questions\nfor human resolution]
    OB7 --> NARROW
    OB6 -- No --> NARROW

    EXISTING -- No --> NARROW

    NARROW[Iterative narrowing:\none question at a time\nuntil all gaps answered] --> WEB[Web search on each\ntechnology mentioned:\nversion · docs · gotchas · alternatives]
    WEB --> WRITE[Write entities in real time:\nGoals · Constraints · Tech Stack\nDecisions · Questions · Risks]
    WRITE --> VAL[Validation pass:\nconflict check · gap check\nfeasibility check]

    VAL --> FEASIBLE{Feasible?}
    FEASIBLE -- No --> INFEAS[Infeasibility Finding:\nname conflict · enumerate options]
    INFEAS --> HDEC{Human\ndecision}
    HDEC -- Revise --> NARROW
    HDEC -- Reduced scope --> SC[Scope Change on\nGoal or Constraint]
    SC --> VAL
    HDEC -- Stop --> ABANDON([Project Abandoned\nFinding = Completion Record])

    FEASIBLE -- Yes --> CONFIRM[Human confirms\nentity summary]
    CONFIRM --> MORE{Corrections\nor additions?}
    MORE -- Yes --> WRITE
    MORE -- No --> PCR[Write Phase 1\nCompletion Record]
    PCR --> GATE{Gate\npassed?}
    GATE -- No --> WRITE
    GATE -- Yes --> DONE([Phase 1 Complete\nContext Reset])
```

---

## 4 — Phase 3: Decomposition Detail

```mermaid
flowchart TD
    ENTRY([Read Phase 1 output]) --> EPICS[Propose Epic structure\nbased on Goals + Tech Stack]
    EPICS --> INFRA{Infrastructure\nwork needed?}
    INFRA -- Yes --> IEPIC[Propose Infrastructure Epics\nlink to Constraints or Rules]
    IEPIC --> HUMAN
    INFRA -- No --> HUMAN
    HUMAN[Human reviews:\nadd · remove · merge · split Epics] --> SCOPE[Define Scope-In and Scope-Out\nper Epic — challenge vague statements]
    SCOPE --> DEPS[Define Epic Dependencies:\nhard · soft · gate conditions]
    DEPS --> MS[Define Milestones\nwith Exit Criteria as observable facts]
    MS --> MAP[Map Goals to Epics\ncheck every Goal covered\ncheck every non-infra Epic maps to a Goal]
    MAP --> GAP{Any Goal\nwithout an Epic?}
    GAP -- Yes --> EPICS
    GAP -- No --> RISK[Update Risk Register\nwith planning-phase risks]
    RISK --> PCR[Write Phase 2\nCompletion Record]
    PCR --> GATE{Gate\npassed?}
    GATE -- No --> MAP
    GATE -- Yes --> DONE([Phase 2 Complete\nContext Reset])
```

---

## 5 — Phase 4: Bootstrap + Implementation Loop

```mermaid
flowchart TD
    ENTRY([Read Phase 2 output]) --> TASK[One Epic at a time\npropose task list → Human reviews]
    TASK --> RESEARCH[Research each confirmed task:\nweb search → Context field + Research Date]
    RESEARCH --> STALE{Approach\nstill valid?}
    STALE -- No --> UPDATE[Revise approach\nbefore finalising task]
    UPDATE --> PC
    STALE -- Yes --> PC
    PC[Define Pattern Contracts\nstatus = draft] --> PD[Declare Pattern Dependencies\nwith Locked Version]
    PD --> VER[Pre-populate Verifications\nfor high-risk tasks]
    VER --> SUB[Write Subtasks\nAcceptance Criteria last]
    SUB --> DEPDEP[Map Dependencies:\nTask-level + confirm Epic-level]
    DEPDEP --> RISKLOG[Log Risks from research]
    RISKLOG --> MORE{More tasks\nin this Epic?}
    MORE -- Yes --> TASK
    MORE -- No --> MOREEPIC{More\nEpics?}
    MOREEPIC -- Yes --> TASK
    MOREEPIC -- No --> QRESOLVE[Resolve or record\nall open Questions]
    QRESOLVE --> PCR[Write Phase 3\nCompletion Record]
    PCR --> GATE{Gate\npassed?}
    GATE -- No --> QRESOLVE
    GATE -- Yes --> DONE([Phase 3 Complete\nContext Reset])
```

---

## 6 — Task Execution Detail

```mermaid
flowchart TD
    BOOTSTRAP([Phase 4 First Session:\nBootstrap sequence]) --> SEL

    SEL[Select Task:\nhighest-priority Pending\nEpic Dependencies satisfied\nno Blockers · no Needs Review\nall hard Dependencies satisfied] --> LOAD[Load Task fully:\nContext · Subtasks · Pattern Dependencies\nPattern Contracts at current version]

    LOAD --> STALECK{Context\nstale?}
    STALECK -- Yes --> REVERIFY[Re-verify Context\nadd Research Verification attempt]
    REVERIFY --> STILL{Still\nvalid?}
    STILL -- No --> UPDCTX[Update Context\nnew Research Date]
    STILL -- Yes --> DELCK
    UPDCTX --> DELCK
    STALECK -- No --> DELCK

    DELCK{Delegation\nlevel?} -- Implement --> EXEC
    DELCK{Delegation\nlevel?} -- Plan --> PLAN[Produce plan\nawait human approval]
    PLAN --> APPROVE{Approved?}
    APPROVE -- Yes --> EXEC
    APPROVE -- No --> PLAN
    DELCK -- Research --> RSCH[Investigate\nreturn findings only]
    RSCH --> HDEC[Human decides\nrecord Decision]
    HDEC --> NEWT{New task\nneeded?}
    NEWT -- Yes --> ADD([Task Addition\nFlow 10])
    NEWT -- No --> SEL
    DELCK -- Human --> HWORK[Human executes\nagent assists only]
    HWORK --> COMPCK
    DELCK -- Specialist --> SROUTE([Specialist Routing\nFlow 11])

    EXEC[Execute per Subtask list\ncheck off each step\nWork Intervals auto-recorded] --> DISCOVER{Unexpected\ndiscovery?}
    DISCOVER -- Scope change --> CR([Change Request\nFlow 9])
    DISCOVER -- Missing task --> TADD([Task Addition\nFlow 10])
    DISCOVER -- Delegation change --> SURFACE[Surface to human\ndo not proceed autonomously]
    DISCOVER -- None --> COMPCK

    COMPCK{All Subtasks\ndone?} -- No --> EXEC
    COMPCK -- Yes --> VCHECK{Verifications\nrequired?}

    VCHECK -- Yes --> VRUN([Verification Flow\nFlow 7])
    VRUN --> VRESULT{All current\nresults passed?}
    VRESULT -- No --> BLOCKED([Verification Failure\nRecovery Loop Flow 7])
    VRESULT -- Yes --> COMP
    VCHECK -- No --> COMP

    COMP[Write Completion Record\naggregate Work Log\nPattern Contracts → established\ndownstream tasks → Needs Review if contract changed] --> REVIEW([In Review:\nHuman Review Outcomes Flow 8])
```

---

## 7 — Verification Failure Recovery Loop

```mermaid
flowchart TD
    VRUN[Run Verification:\nadd attempt to history] --> RESULT{Attempt\nresult?}

    RESULT -- Passed --> CLEAR[Clear Stale flag if set\nVerification current result = passed] --> CONTINUE([Return to task flow\nTask can proceed to Done])

    RESULT -- Partial --> PNOTE[Record Notes on\nwhat remains unresolved] --> HUMAN{Human\nreview needed?}
    HUMAN -- Yes --> HFLAG[Flag for human\nCreate Question] --> WAIT([Wait for resolution\nTask stays Active])
    HUMAN -- No --> CONTINUE

    RESULT -- Failed --> BLOCKER[Create Blocker:\nType: Verification Failure\nDescription: what failed · which Verification\nResolution Path: what must change]
    BLOCKER --> REGRESS[Task status:\nIn Review → Active]
    REGRESS --> UNSUB[Un-check Subtasks\nrelevant to failed area]
    UNSUB --> REWORK[Agent executes rework\nwithin scoped Subtask area]
    REWORK --> RETRY[Add new attempt\nto Verification Attempts list]
    RETRY --> COUNT{Attempt\nnumber?}
    COUNT -- "< 3" --> RESULT
    COUNT -- ">= 3" --> ESCALATE[Create Question:\nescalate to human\napproach may be fundamentally wrong]
    ESCALATE --> HDEC{Human\ndecision}
    HDEC -- Revise approach --> TASK_REDESIGN[Rewrite Task Context\nnew Acceptance Criteria\nDecision record created]
    TASK_REDESIGN --> REWORK
    HDEC -- Change Request needed --> CR([Change Request Flow 9])
```

---

## 8 — Human Review Outcomes

```mermaid
flowchart TD
    INREVIEW([Task in 👀 In Review]) --> HREVIEWS[Human reviews\nCompletion Record]

    HREVIEWS --> OUTCOME{Review\noutcome}

    OUTCOME -- Approved --> APPROVED[Log approval in\nCompletion Record] --> DONE([✅ Done])

    OUTCOME -- "Accepted with Notes" --> NOTES[Populate Learnings field\nin Completion Record]
    NOTES --> CONV{Learning is\nproject-wide?}
    CONV -- Yes --> NEWCONV[Create or update\nConvention resource]
    NEWCONV --> DONE
    CONV -- No --> DONE

    OUTCOME -- "Minor Revision" --> MINOR[Record revision scope\nin review notes\nClear Completion Record]
    MINOR --> ACTIVE1[Task → 🔄 Active\nAgent executes revision\nwithin stated scope only]
    ACTIVE1 --> VLOOP([Verification Flow 7])
    VLOOP --> INREVIEW

    OUTCOME -- "Significant Rework" --> SCALE{Recoverable?}
    SCALE -- Yes --> RECOVER[Task → 🔄 Active\nBlocker created:\nType: Resource\ndescribes what was wrong]
    RECOVER --> ACTIVE2[Agent executes rework\nClear Completion Record]
    ACTIVE2 --> VLOOP

    SCALE -- No --> ACCEPT[Original task marked ✅ Done\nas-specified completion is accurate history]
    ACCEPT --> NEWTASK[New corrective Task created\nvia Task Addition process]
    NEWTASK --> DECISION[Decision record:\nwhy original accepted\nwhat correct approach is]
    DECISION --> LOOP([Continue implementation loop])
```

---

## 9 — Change Management Flow

```mermaid
flowchart TD
    TRIGGER([Trigger:\nHuman request · Agent discovery\nResolved Question · Realized Risk\nTech Stack version change]) --> CREATE[Create Change Request:\nTarget entity · Previous state\nProposed state · Rationale]

    CREATE --> IMPACT[Impact Analysis:\nTasks → Needs Review\nVerifications → Stale\nPattern Contracts → re-version\nPhase re-runs needed]

    IMPACT --> HUMANREV[Present to Human\nfor approval]

    HUMANREV --> DECISION{Human\ndecision}

    DECISION -- Rejected --> REJREC[Record rejection rationale\nas Decision entity]
    REJREC --> ALTPATH{Alternative\npath needed?}
    ALTPATH -- Yes --> QUESTION[Create or update\nopen Question]
    ALTPATH -- No --> END([Process ends])

    DECISION -- Approved --> SC[Create Scope Change:\nCopy before/after state\nCopy cascade map]

    SC --> APPLY[Apply changes:]
    APPLY --> A1[Update target entity\nto new state]
    A1 --> A2[Flag downstream Tasks\n⚠️ Needs Review]
    A2 --> A3[Mark Verifications Stale]
    A3 --> A4[Re-version Pattern Contracts\nif definition affected]
    A4 --> A5[Initiate Phase re-runs\nif required]
    A5 --> CHECKLIST[Required Actions\nchecklist populated]

    CHECKLIST --> ACTIONS{All required\nactions complete?}
    ACTIONS -- No --> ACTIONS
    ACTIONS -- Yes --> STATUS[Scope Change\nStatus → Applied]
    STATUS --> RESUME([Work resumes])
```

---

## 10 — Task Addition Process (Unplanned Discovery)

```mermaid
flowchart TD
    DISCOVERY([Agent discovers missing task\nduring Phase 4 execution]) --> STOP[Pause current task\npreserve Subtask state in Session Log]

    STOP --> SURFACE[Describe the gap:\nwhat is missing · why necessary\nwhich Epic and Goal it maps to]

    SURFACE --> INSCOPE{Maps to existing\nEpic and Goal?}

    INSCOPE -- No --> CR([Change Request first\nFlow 9 — new Epic or Goal needed])
    CR --> CONFIRMED{Change\napproved?}
    CONFIRMED -- No --> RESUME1([Resume original task\nwithout new task])
    CONFIRMED -- Yes --> QUESTION

    INSCOPE -- Yes --> QUESTION[Create Question:\nIs this work in scope?\nHuman must confirm]

    QUESTION --> HDEC{Human\nconfirms scope?}
    HDEC -- No --> RESUME1
    HDEC -- Yes --> DECISION[Record Decision:\nscope confirmed · rationale]

    DECISION --> CREATE[Create full Task entity:\nContext + Research Date\nAcceptance Criteria · Affected Files\nSubtasks · Delegation level\nPattern Contracts/Dependencies]

    CREATE --> WIRE[Wire Dependencies:\nwhat does new task require?\nwhat does it enable?]

    WIRE --> ORDER{New task must\nprecede paused task?}

    ORDER -- Yes --> BLOCKER[Create Blocker on paused task:\nType: Dependency → new Task ID\nPaused task stays Blocked]
    BLOCKER --> WORK_NEW[Work new task first]
    WORK_NEW --> CLEAR[Blocker cleared\nwhen new task Done]
    CLEAR --> RESUME2([Resume original task])

    ORDER -- No --> WHY[Create Decision record:\nwhy not discovered in Phase 3]
    WHY --> RESUME2

    RESUME2 --> SESSIONLOG[Update Session Log:\nActive Task · Exact State]
```

---

## 11 — Specialist Routing Process

```mermaid
flowchart TD
    SPTASK([Task with Specialist delegation\nreached or escalated]) --> BLOCK[Task → ⛔ Blocked\nBlocker Type: Specialist Routing\nBlocker Description: specific capability needed]

    BLOCK --> SURFACE[Surface to Human:\nwhich agent · tool · person\nshould handle this?\nwhat output format is expected?]

    SURFACE --> DECISION[Record routing Decision:\nwho · why · expected output format]

    DECISION --> ROUTE[Specialist works\nTask stays Blocked]

    ROUTE --> ARRIVES{Specialist\noutput arrives?}
    ARRIVES -- Not yet --> ROUTE

    ARRIVES -- Yes --> ATTACH[Attach output to Task:\nAttachment labeled as Specialist output\nwith source and date]

    ATTACH --> VERIFY[Create Verification:\nType: External Validation\nSource: Specialist output Attachment]
    VERIFY --> VATTEMPT[Record first attempt:\nexamine output against task requirements]

    VATTEMPT --> VRESULT{Verification\nresult?}

    VRESULT -- Passed --> CLEAR[Clear Blocker]
    CLEAR --> DELIVERABLE{Specialist output\nis the deliverable?}
    DELIVERABLE -- Yes --> INREVIEW([Task → 👀 In Review\nHuman Review Outcomes Flow 8])
    DELIVERABLE -- No --> ACTIVE([Task → 🔄 Active\nAgent integrates output])

    VRESULT -- Partial --> QUESTION[Create Question:\nwhat is insufficient\nfrom the Specialist output]
    QUESTION --> REROUTE{Re-route or\nsupplement?}
    REROUTE -- Re-route --> ROUTE
    REROUTE -- Supplement --> SROUTE2[Human decides\nsupplemental approach]
    SROUTE2 --> ROUTE

    VRESULT -- Failed --> NEWQ[Create Question:\noutput is insufficient]
    NEWQ --> SCOPE{Scope\nchange needed?}
    SCOPE -- Yes --> CR([Change Request Flow 9])
    SCOPE -- No --> REROUTE
```

---

## 12 — Epic Completion Flow

```mermaid
flowchart TD
    TRIGGER([All Tasks in Epic\nreach ✅ Done]) --> EVAL[Agent evaluates\nAcceptance Criteria]

    EVAL --> AGENT{Agent-verifiable\ncriteria}
    AGENT --> ACHECK[Check each criterion\nrecord met / not met + how verified]

    ACHECK --> HUMAN{Human-verification\nrequired criteria?}
    HUMAN -- Yes --> HCHECK[Present checklist to human\nfor manual confirmation]
    HCHECK --> HRESULT{Human\nconfirms all?}
    HRESULT -- No --> GAP
    HRESULT -- Yes --> ALLMET

    HUMAN -- No --> ALLMET{All agent\ncriteria met?}
    ALLMET -- Yes --> FLAG[Flag Epic for\nhuman confirmation]
    FLAG --> HCONFIRM{Human\nconfirms?}
    HCONFIRM -- Yes --> COMPLETE[Epic Status → complete]
    COMPLETE --> ECR[Write Epic Completion Record:\ntimestamp · criteria results\nscope delta · costs · learnings]
    ECR --> GCHECK([Trigger Goal\nStatus Check Flow 13])

    HCONFIRM -- No --> GAP

    ALLMET -- No --> GAP([Criteria not all met])
    GAP --> GPATH{Resolution\npath}
    GPATH -- New tasks needed --> TADD([Task Addition Flow 10])
    TADD --> TRIGGER
    GPATH -- Criteria revision --> CR([Change Request Flow 9])
    CR --> EVAL
    GPATH -- Scope acceptance --> ACCEPT[Human accepts with\nmandatory documented caveat]
    ACCEPT --> COMPLETE
```

---

## 13 — Milestone Completion Flow

```mermaid
flowchart TD
    TRIGGER([All Associated Epics\nreach complete]) --> EVAL[Agent evaluates\nExit Criteria]

    EVAL --> ACHECK[Agent-verifiable criteria:\ncheck and record each]
    ACHECK --> HFLAG{Human-verification\nrequired?}

    HFLAG -- Yes --> HLIST[Present unverifiable criteria\nto human as checklist]
    HLIST --> HRESULT{Human\nconfirms all?}
    HRESULT -- No --> GAP
    HRESULT -- Yes --> ALLMET

    HFLAG -- No --> ALLMET{All criteria\nmet?}
    ALLMET -- No --> GAP

    ALLMET -- Yes --> CONFIRM[Flag Milestone for\nhuman confirmation]
    CONFIRM --> HCON{Human\nconfirms?}
    HCON -- Yes --> REACHED[Milestone Status → reached]
    REACHED --> MRR[Write Milestone Review Record:\ntimestamp · criteria results\nepics on time vs slipped\nscope delta · AI cost\ndecisions · risks realized · notes]
    MRR --> RISKREV[Review open Risks:\nre-confirm accepted risks\nescalate any newly-realized]
    RISKREV --> QREV[Review open Questions:\nresolve any unblocked by Milestone]
    QREV --> GCHECK([Goal Status Check\nfor Goals whose\nContributing Epics are now all complete])

    HCON -- No --> GAP([Exit Criteria not all met])
    GAP --> GPATH{Resolution\npath}
    GPATH -- New tasks --> TADD([Task Addition Flow 10\nthen re-run Epic Completion])
    GPATH -- Criteria revision --> CR([Change Request Flow 9])
    GPATH -- Scope acceptance --> ACCEPT[Human accepts with\nmandatory documented caveat]
    ACCEPT --> REACHED
```

---

## 14 — Goal Status Check

```mermaid
flowchart TD
    TRIGGER([Epic reaches complete\nor Milestone reached]) --> CHECK[Check all Contributing Epics\nfor this Goal]

    CHECK --> FIRST{Any Contributing\nEpic now active?}
    FIRST -- "Yes and Goal = not started" --> PROGRESS[Goal Status →\nin progress\nautomatically]
    PROGRESS --> CONTINUE([Continue])

    FIRST -- No change needed --> CONTINUE

    CHECK --> ALL{All Contributing\nEpics complete?}
    ALL -- No --> CONTINUE

    ALL -- Yes --> EVAL[Agent evaluates\nGoal Statement as yes/no]
    EVAL --> CANEVAL{Agent can\nconfirm?}

    CANEVAL -- Yes --> GOALMET{Goal\nStatement met?}
    GOALMET -- Yes --> FLAG[Flag for human confirmation]
    FLAG --> HCONFIRM{Human\nconfirms?}
    HCONFIRM -- Yes --> ACHIEVED[Goal Status → achieved]
    ACHIEVED --> GCR[Write Goal Completion Record]
    GCR --> PROJCHECK([Check Project\nCompletion Condition])
    HCONFIRM -- No --> GAP

    GOALMET -- No --> GAP([Goal not met\ndespite Epics complete])
    GAP --> GPATH{Resolution\npath}
    GPATH -- New tasks --> TADD([Task Addition Flow 10])
    GPATH -- Scope revision --> CR([Change Request Flow 9])
    GPATH -- Scope acceptance --> ACCEPT[Human accepts\nwith mandatory rationale]
    ACCEPT --> ACHIEVED

    CANEVAL -- No --> HEVAL[Present unverifiable aspects\nto human for manual confirmation]
    HEVAL --> HRESULT{Human\nconfirms?}
    HRESULT -- Yes --> FLAG
    HRESULT -- No --> GAP
```

---

## 15 — Needs Review Resolution

```mermaid
flowchart TD
    TRIGGER([Task flagged ⚠️ Needs Review:\nPattern Contract changed or superseded]) --> READ[Agent reads Review Note:\nlocked version · current version · diff summary]

    READ --> SUPERSEDED{Contract\nsuperseded?}
    SUPERSEDED -- Yes --> FORCE[Outcome 3 minimum:\ndependency assumption gone\nassess if replacement contract exists]
    FORCE --> REPLACE{Replacement\ncontract exists?}
    REPLACE -- Yes --> REPOINT[Re-point Pattern Dependency\nto new contract at current version]
    REPOINT --> REWORK
    REPLACE -- No --> REWRITE[Rewrite Context without\nthe dependency\nDecision record required]
    REWRITE --> O3

    SUPERSEDED -- No --> DELEGATION{Task\ndelegation}
    DELEGATION -- "Implement / Plan" --> AGENT[Agent reviews diff\ndetermines outcome]
    DELEGATION -- Human --> HREVIEW[Surface diff to human\nhuman decides outcome]
    HREVIEW --> OUTCOME
    AGENT --> OUTCOME{Outcome}

    OUTCOME -- "No Impact" --> O1[Pattern Dependency\nReview Status → current\nTask → ⏳ Pending\nWrite Review Record in Notes]

    OUTCOME -- "Context Update" --> O2[Update Context and/or\nAcceptance Criteria]
    O2 --> O2B[Pattern Dependency Locked Version\nupdated to current\nReview Status → updated]
    O2B --> O2C{Human\nconfirmation\nneeded?}
    O2C -- "Human delegation" --> HCON[Human confirms\nupdated definition]
    O2C -- "Other delegation" --> PENDING
    HCON --> PENDING[Task → ⏳ Pending\nWrite Review Record in Notes]

    OUTCOME -- "Significant Rework" --> REWORK[Rewrite Context:\nnew approach]
    REWORK --> O3[Revise Subtasks if needed\nCreate Decision record:\nwhy original approach invalid]
    O3 --> O3B[Human confirms\nrevised task definition]
    O3B --> O3C[Pattern Dependency Locked Version updated\nReview Status → updated\nTask → ⏳ Pending\nWrite Review Record in Notes]
```

---

## 16 — Question Aging & Escalation

```mermaid
flowchart TD
    CREATE([Question created:\nDescription · Impact · Owner · Options]) --> OPEN[Status: open\nSession Count: 0]

    OPEN --> SESSEND{Session\nends}
    SESSEND --> INC[Session Count + 1]
    INC --> THRESHOLD{Session\nCount >= 3?}
    THRESHOLD -- Yes --> ESCALATE[Escalation Flag set\nMarked distinctly in Session Log]
    ESCALATE --> SURFACE[Agent surfaces at next session start:\ndescription · options · blocking tasks]
    THRESHOLD -- No --> CHECK

    CHECK{Task with this\nQuestion in Impact\ngoes Active?} -- Yes --> AUTOBLOCKER[Auto-generate Blocker\non that Task:\nType: Decision\nDescription from Question]
    AUTOBLOCKER --> WAIT([Task Blocked\nuntil Question resolved])

    CHECK -- No --> MILESTONE{Milestone\nboundary\nreached?}
    MILESTONE -- Yes --> MSREVIEW[Review Question:\ncan Milestone output resolve it?]
    MSREVIEW --> RESOLVE{Resolve\nnow?}
    RESOLVE -- Yes --> RESOLVED
    RESOLVE -- No --> DEFER{Defer with\nre-eval trigger?}
    DEFER -- Yes --> DEFERRED[Status: deferred\nSession Count paused\nRe-eval trigger recorded]
    DEFERRED --> RETRIG{Trigger\ncondition met?}
    RETRIG -- Yes --> OPEN
    RETRIG -- No --> DEFERRED
    DEFER -- No --> CHECK

    MILESTONE -- No --> CHECK

    SURFACE --> HDEC{Human\ndecision}
    HDEC -- Answer given --> RESOLVED[Status: resolved\nResolution recorded\nResulting Decision or Scope Change linked]
    HDEC -- Defer --> DEFERRED
    HDEC -- Drop --> DROPPED[Status: dropped\nRationale recorded]

    RESOLVED --> UNBLOCK{Was auto-Blocker\ncreated?}
    UNBLOCK -- Yes --> CLEARB[Clear Blocker\nTask → Active]
    UNBLOCK -- No --> END([End])
    CLEARB --> END
```

---

## 17 — Risk Lifecycle

```mermaid
flowchart TD
    IDENTIFY([Risk identified:\nPhase 1 · 2 · 3 · or 4]) --> CREATE[Create Risk:\nDescription · Likelihood · Impact\nAffected entities · Mitigation · Owner]

    CREATE --> OPEN[Status: open]

    OPEN --> REVIEW{Periodic review:\nsession start or\nMilestone boundary}

    REVIEW --> CHANGE{Likelihood\nor Impact changed?}
    CHANGE -- Yes --> UPDATE[Update Risk\nrecord change]
    UPDATE --> REVIEW

    CHANGE -- No --> STATUS{Status\nchange?}

    STATUS -- Mitigate --> MITIGATE{Mitigation\ntype}
    MITIGATE -- Task --> MTASK[Link mitigation Task ID\ntrack Task to Done]
    MITIGATE -- Decision --> MDEC[Link Decision ID]
    MITIGATE -- Rule/Convention --> MRULE[Link Project Resource]
    MTASK --> MCHECK{Mitigation\ncomplete?}
    MDEC --> MCHECK
    MRULE --> MCHECK
    MCHECK -- No --> REVIEW
    MCHECK -- Yes --> MITIGATED[Status: mitigated\nRecord what prevented it]

    STATUS -- Realize --> REALIZED[Status: realized\nRecord what happened]
    REALIZED --> BLOCKER[Create Blocker on\neach affected Task:\nType: Resource or External\nDescription from Risk\nResolution from Mitigation field]
    BLOCKER --> CR{Epic-level\nimpact?}
    CR -- Yes --> CHANGE_REQ([Change Request Flow 9])
    CR -- No --> RWORK[Rework within\nexisting task scope]
    RWORK --> RESOLVED[Blocker cleared\nRisk annotated with\nhow it was resolved]

    STATUS -- Accept --> ACCEPT[Human sign-off required\nAcceptance rationale mandatory]
    ACCEPT --> ACCEPTED[Status: accepted\nRemains visible\nRe-reviewed at each Milestone]

    STATUS -- No change --> REVIEW
```

---

## 18 — Phase Completion Record Gate

```mermaid
flowchart TD
    PHASEEND([Phase work\ncomplete]) --> WRITE[Write Phase Completion Record:\nphase number · timestamp\noutput checklist · open Questions\nentry condition for next phase]

    WRITE --> CHECK[Evaluate each\nchecklist item:\npresent and internally consistent?]

    CHECK --> ALL{All items\npassed?}

    ALL -- No --> GAPS[List failed items:\nspecific gaps with explanation]
    GAPS --> RETURN[Return to phase:\nclose gaps]
    RETURN --> WRITE

    ALL -- Yes --> GATE[Gate Status → passed]
    GATE --> RESET[Context Reset:\ndiscard conversation\ncarry only structured files]
    RESET --> NEXT[Next phase agent\nreads PCR first]
    NEXT --> CONFIRM{Gate status\n= passed?}
    CONFIRM -- No --> STOP([Stop: surface gaps\nto human])
    CONFIRM -- Yes --> BEGIN([Begin next phase])
```
