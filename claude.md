# Story Creator — ChillTown Mission Graph Editor

A visual node-based editor for authoring missions in the ChillTown Unity game. Built with TanStack Start + React + TypeScript, using `@xyflow/react` for the canvas and PostgreSQL for persistence.

## What This Is

Collaborators use this tool to create and connect missions visually instead of editing Unity ScriptableObjects by hand. Each mission is a node on a canvas. Directed edges between nodes represent prerequisites — Mission A must be completed before Mission B unlocks.

Data is persisted to PostgreSQL via TanStack Start server functions. The app also exports JSON matching the Unity `MissionDefinition` shape for import back into Unity.

## Tech Stack

- TanStack Start — full-stack React framework (server functions, file-based routing)
- React 19 + TypeScript
- `@xyflow/react` — node canvas
- Drizzle ORM — database access
- PostgreSQL — persistence
- pnpm

## Running the Project

```bash
pnpm dev
```

## Database Schema

Three tables. Stages and dialogues are stored as JSONB columns inside missions to keep queries simple and avoid over-normalizing data that is always loaded together.

```
characters    id, name, age, description
buildings     id, building_name
missions      id, mission_name, description, mission_type, prerequisites (jsonb),
              stages (jsonb), position_x, position_y
```

`position_x` / `position_y` store the node's canvas position so the layout is preserved across sessions.

`prerequisites` is a JSON array of mission IDs.

`stages` is a JSON array of `MissionStage` objects (see data model below).

## Data Model

This mirrors the Unity C# scripts in `ChillTown/Assets/Scripts/Mission/`.

### Mission (node)

```ts
type MissionType = "Story" | "Side" | "Base";

interface Mission {
  id: string;
  missionName: string;
  description: string;
  missionType: MissionType;
  prerequisites: string[]; // IDs of missions that must be completed first
  stages: MissionStage[];
  position: { x: number; y: number }; // canvas position
}
```

### MissionStage (lives inside a mission node, not a separate node)

```ts
type StageType = "Dialogue" | "Pickup" | "Drop";

interface MissionStage {
  stageType: StageType;
  targetBuildingId: string | null; // references Building.id, null = random
  statusMessage: string;           // shown in HUD during this stage
  dialogues: DialogueLine[];
  cargoWeight: number;             // Pickup only
  timeLimit: number;               // Drop only, 0 = no limit
}
```

### DialogueLine (lives inside a stage)

```ts
interface DialogueLine {
  speakerId: string; // references Character.id
  text: string;
}
```

### Character (global registry — created separately, referenced by dropdown)

```ts
interface Character {
  id: string;
  name: string;
  age: number;
  description: string;
}
```

Characters are managed in a global list (not on the canvas). In any `DialogueLine`, the speaker is selected from a dropdown of defined characters.

### Building (global registry — created separately, referenced by dropdown)

```ts
interface Building {
  id: string;
  buildingName: string;
}
```

Buildings are managed in a global list. In any `MissionStage`, `targetBuildingId` is selected from a dropdown of defined buildings (or left null for random).

## Node Types

All mission nodes share the same data shape. Node type controls visual styling only:

| Type    | Description                             |
| ------- | --------------------------------------- |
| `Story` | Main campaign missions — distinct color |
| `Side`  | Optional side missions — distinct color |
| `Base`  | Reserved, may be used later             |

## Edge Convention

A directed edge **A → B** means: _Mission A is a prerequisite of Mission B_ (A must be completed before B is available).

Edges are drawn from the **output handle** of the prerequisite mission to the **input handle** of the dependent mission. Edges are derived from `prerequisites` — they are not stored separately.

## Canvas Layout

- Each mission = one xyflow custom node
- Node shows: mission name, type badge, description (truncated), stage count
- Clicking a node opens a side panel for full editing (all fields, stages, dialogues)
- Stages are ordered — order matters for gameplay
- The side panel lets you add/remove/reorder stages and dialogue lines
- Node positions are saved to the DB on drag end

## Server Functions

Use `.inputValidator()` (not `.validator()`) when adding input validation to server functions — the API is `createServerFn().inputValidator(schema).handler(fn)`.

All DB access goes through TanStack Start server functions — no separate API layer. Keep server functions thin (query → return data). Put business logic in shared utils if needed.

## JSON Export

Export produces an array of `Mission` objects (without `position`) matching the Unity `MissionDefinition` shape. `speakerId` is resolved to `speakerName`, `targetBuildingId` to `buildingName` at export time. This JSON is consumed by a Unity importer script that creates `MissionDefinition` ScriptableObjects.

## Conventions

- No comments unless the WHY is non-obvious
- Prefer editing existing files over creating new ones
- Node rendering logic in `src/components/nodes/`, shared types in `src/types/mission.ts`, Drizzle schema in `src/db/schema.ts`, server functions colocated with routes
- Global registries (Characters, Buildings) are edited via a dedicated panel/modal, not on the canvas
- Do not add abstractions beyond what a current feature needs
