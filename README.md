# Dynamic Graph Coloring Based Exam Timetabling and Seating Plan Generator

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-8%20Passed-emerald.svg)]()

A complete, production-quality university examination management system designed for **Fundamentals of Graph Theory Lab**. It dynamically constructs conflict graphs from student course enrollments, applies independent **Greedy Graph Coloring** and **DSATUR (Degree of Saturation)** algorithms to schedule conflict-free examination time slots, and performs room allocation using **First-Fit Decreasing (FFD) Bin Packing**.

---

## 1. Problem Statement & Mathematical Formulation

In university environments, students enroll in overlapping combinations of core and elective subjects. Holding two conflicting examinations concurrently forces co-enrolled candidates into an impossible schedule. Furthermore, allocating students into examination halls with physical desk capacities without room fragmentation is an NP-hard packing problem.

### Mathematical Formulation

1. **Conflict Graph Definition**:
   $$G = (V, E)$$
   - **Vertices ($V$)**: Each vertex $v_i \in V$ represents a distinct examination paper.
   - **Conflict Edges ($E$)**: An undirected edge $(u, v) \in E$ is formed if and only if:
     $$\text{Students}(u) \cap \text{Students}(v) \neq \emptyset$$
   - **Edge Weight**: Represents the cardinality of overlapping students:
     $$w(u, v) = |\text{Students}(u) \cap \text{Students}(v)|$$

2. **Graph Coloring Objective**:
   Assign each vertex $v \in V$ an integer color $c(v) \in \{0, 1, \dots, k-1\}$ such that:
   $$\forall (u, v) \in E, \quad c(u) \neq c(v)$$
   Minimizing $k$ (the chromatic number $\chi(G)$), which represents the total examination time slots.

3. **Room Allocation via Bin Packing**:
   For each time slot $s$:
   - Group students by examination $v$ where $c(v) = s$.
   - Pack examination groups into available rooms $R = \{r_1, r_2, \dots, r_m\}$ sorted by capacity descending (First-Fit Decreasing), ensuring no room exceeds its maximum seating capacity.

---

## 2. Core Algorithms Implemented

### A. Standard Greedy Graph Coloring
- Traverses vertices in deterministic order of **decreasing vertex degree $\Delta(v)$**.
- For each vertex, collects colors assigned to all its adjacent neighbors.
- Assigns the smallest available non-conflicting color integer ($0, 1, 2, \dots$).
- Time Complexity: $\mathcal{O}(|V|^2 + |E|)$.

### B. DSATUR (Degree of Saturation) Algorithm (Brélaz, 1979)
- **Saturation Degree $\rho(v)$**: Number of distinct colors present among colored neighbors of vertex $v$.
- Repeated selection loop:
  1. Select uncolored vertex with maximal saturation degree $\rho(v)$.
  2. Tie-break 1: Vertex with highest degree in the uncolored subgraph.
  3. Tie-break 2: Deterministic examination code / ID comparison.
  4. Assign smallest available non-conflicting color.
  5. Dynamically update saturation degrees of adjacent neighbors.
- Time Complexity: $\mathcal{O}(|V|^2)$.

### C. First-Fit Decreasing (FFD) Bin Packing for Seating
- Filters available examination rooms and sorts them by capacity descending.
- Groups students by enrolled subject in the current time slot.
- Allocates students sequentially into halls, prioritizing keeping subjects in contiguous desk blocks and reporting exact surplus seat shortages if capacity is breached.

---

## 3. Technology Stack

- **Frontend Framework**: Next.js 16 (App Router) with React 19 & TypeScript
- **Styling & UI**: Tailwind CSS v4, Lucide React icons, React Hot Toast
- **Network Graph Visualizer**: Cytoscape.js with interactive Force-Directed (CoSE), Concentric, and Circle layouts
- **Analytics & Charts**: Recharts
- **Form & Schema Validation**: Zod
- **Testing Framework**: Vitest with Node/JSDOM environment
- **Database**: In-Memory Singleton Store with zero external latency + Supabase PostgreSQL Migration Scripts

---

## 4. Key Application Features

1. **Executive Dashboard**:
   - Live KPI cards: Total students, exams, rooms, enrollments, conflict edges, chromatic time slots, and room utilization percentage.
   - Recharts visual distributions of enrollments per course and department breakdowns.
2. **Student & Examination Management**:
   - Full CRUD operations with instant search and department/semester filtering.
   - Bulk CSV import and CSV export for both students and exams.
   - Modal inspection of enrolled subjects per candidate.
3. **Enrollment Overlap Mapping**:
   - Explicit student-to-exam mapping with automated duplicate prevention and invalid foreign key rejection.
4. **Examination Rooms**:
   - Hall capacity management, availability status toggles, and positive-capacity constraints.
5. **Interactive Cytoscape.js Conflict Graph**:
   - Dual-mode visualization: **Uncolored Graph** (base conflict network) vs **Chromatic Timetable** (colored by assigned time slot).
   - Edge thickness weighted by student overlap count.
   - Interactive zoom, pan, search node, and click-to-inspect neighbor conflicts.
6. **Timetable Generator & Algorithm Comparison**:
   - Independent execution of Greedy and DSATUR.
   - Side-by-side performance cards with chromatic slot counts and execution times in milliseconds.
   - Automated recommendation banner and conflict-free verification checker.
7. **Room-Wise Seating Allocation**:
   - Bin packing visualization with per-hall occupancy progress bars.
   - **Instant Student Desk Finder**: Search any student by name or enrollment number to immediately locate their scheduled hall, time slot, and seat number.
8. **Print & PDF Reports**:
   - **A. Room Seating Plan PDF**: Invigilator door charts with candidate lists and seat numbers.
   - **B. Master Seating Plan PDF**: Multi-slot university register.
   - **C. Algorithm Viva Report**: Formal report detailing topological graph statistics ($|V|$, $|E|$, $\Delta(G)$, density) and coloring proofs.

---

## 5. Project Directory Structure

```
project/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx      # Main executive dashboard
│   │   │   ├── students/page.tsx       # Student CRUD & CSV tools
│   │   │   ├── exams/page.tsx          # Examination CRUD
│   │   │   ├── enrollments/page.tsx    # Course registration mapping
│   │   │   ├── rooms/page.tsx          # Hall capacity management
│   │   │   ├── graph/page.tsx          # Cytoscape.js conflict network
│   │   │   ├── timetable/page.tsx      # Greedy vs DSATUR generator
│   │   │   ├── seating/page.tsx        # FFD Bin Packing allocation
│   │   │   ├── reports/page.tsx        # Room & Master PDF reports
│   │   │   ├── settings/page.tsx       # Dataset reset & system config
│   │   │   └── layout.tsx              # Shell with sidebar & header
│   │   ├── globals.css                 # Tailwind design system tokens
│   │   ├── layout.tsx                  # Root layout with theme provider
│   │   └── page.tsx                    # Home redirect to dashboard
│   ├── components/
│   │   ├── layout/                     # Sidebar, header, navigation
│   │   ├── providers/                  # DataProvider, ThemeProvider
│   │   └── ui/                         # Reusable buttons, dialogs, cards
│   ├── lib/
│   │   ├── algorithms/
│   │   │   ├── graph-construction.ts   # Graph builder & Cytoscape adapters
│   │   │   ├── greedy-coloring.ts      # Greedy graph coloring
│   │   │   ├── dsatur-coloring.ts      # Brélaz's DSATUR algorithm
│   │   │   ├── algorithm-comparison.ts # Benchmarking & recommendation
│   │   │   ├── bin-packing.ts          # First-Fit Decreasing seating
│   │   │   └── validation.ts           # Conflict checker & edge verifier
│   │   ├── database/
│   │   │   ├── demo-data.ts            # Realistic 35-student dataset
│   │   │   └── demo-store.ts           # In-memory singleton repository
│   │   ├── validations/
│   │   │   └── schemas.ts              # Zod schemas
│   │   └── utils.ts                    # Utility helpers & CSV parser
│   └── types/
│       └── index.ts                    # Complete TypeScript definitions
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # PostgreSQL DDL with RLS policies
│   └── seed.sql                        # Comprehensive seed data
├── tests/
│   └── algorithms.test.ts              # Vitest algorithm unit test suite
├── package.json
└── README.md
```

---

## 6. Getting Started & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+

### Installation Steps

1. **Clone or Navigate to the Project Directory**:
   ```bash
   cd e:\JIIT\ODD_Sem_2026\Fundamentals_of_Graph_Theory\FGT_Lab\project
   ```

2. **Install Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect to the interactive `/dashboard`.

4. **Load Demo Dataset**:
   - In the top header or dashboard empty state, click **"Load Demo Data"**.
   - This automatically populates 35 students, 10 examinations, 50+ conflict enrollments, and 6 examination halls.
   - Click **"Recalculate Timetable"** to run graph construction, compare Greedy vs DSATUR, and allocate seats.

---

## 7. Running Unit Tests

To verify graph construction, Greedy coloring, DSATUR, and Bin Packing:

```bash
npm test
```

Expected output:
```
 ✓ tests/algorithms.test.ts (8 tests)
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

---

## 8. Database Setup (Supabase PostgreSQL - Optional)

The application comes ready out-of-the-box with an in-memory database. If you wish to connect it to an external Supabase PostgreSQL database:

1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Run the migration script in the SQL Editor:
   - Copy contents of `supabase/migrations/001_initial_schema.sql` and execute.
   - Copy contents of `supabase/seed.sql` to populate initial tables.
3. Configure your `.env.local`:
   ```env
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 9. Academic Viva Presentation Guide

When presenting this project for evaluation:
1. **Explain the Conflict Graph**: Navigate to `/graph`. Highlight an examination node to demonstrate degree $\Delta(v)$, and click a conflict edge to reveal common candidates causing the clash.
2. **Explain Brooks' Theorem**: State that the chromatic number $\chi(G) \le \Delta(G) + 1$, where $\Delta$ is the maximum degree in the conflict graph.
3. **Compare Greedy vs DSATUR**: Navigate to `/timetable`. Run both algorithms side-by-side to discuss how DSATUR dynamically selects vertices with maximum saturation degree $\rho(v)$ to break ties and minimize chromatic time slots.
4. **Demonstrate Bin Packing**: Navigate to `/seating`. Show the First-Fit Decreasing (FFD) room allocation and test the **Instant Student Desk Finder** by searching a candidate's roll number.
5. **Demonstrate PDF Generation**: Navigate to `/reports` and generate the Invigilator Room Seating Plan and Algorithm Analysis Report.
