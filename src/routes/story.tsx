import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { EdgeChange, Node, NodeChange } from "@xyflow/react";
import {
	Background,
	BackgroundVariant,
	Controls,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	Building2,
	Clipboard,
	ClipboardCheck,
	GitBranch,
	HelpCircle,
	Save,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuildingsModal } from "#/components/BuildingsModal";
import { CharactersModal } from "#/components/CharactersModal";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { HelpModal } from "#/components/HelpModal";
import { ImportJsonModal } from "#/components/ImportJsonModal";
import { MissionPanel } from "#/components/MissionPanel";
import { MissionNode } from "#/components/nodes/MissionNode";
import { VersionsModal } from "#/components/VersionsModal";
import { buildGraphData, useSaveGraph } from "#/hooks/useSaveGraph";
import { getBuildings } from "#/server/buildings";
import { getCharacters } from "#/server/characters";
import { loadCurrentGraph } from "#/server/graph";
import type { MissionNodeData } from "#/store/canvasStore";
import { useCanvasStore } from "#/store/canvasStore";
import type { Mission } from "#/types/mission";

export const Route = createFileRoute("/story")({ component: StoryCreatorPage });

const nodeTypes = { mission: MissionNode };

function StoryCreatorPage() {
	return (
		<ReactFlowProvider>
			<StoryCreator />
		</ReactFlowProvider>
	);
}

type Modal =
	| "characters"
	| "buildings"
	| "versions"
	| "saveVersion"
	| "importJson"
	| "help"
	| null;

interface ContextMenu {
	x: number;
	y: number;
	flowX: number;
	flowY: number;
}

interface PendingDelete {
	type: "nodes" | "edges";
	label: string;
	nodeChanges?: NodeChange<Node<MissionNodeData>>[];
	edgeChanges?: EdgeChange[];
}

function StoryCreator() {
	const [modal, setModal] = useState<Modal>(null);
	const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
	const [versionLabel, setVersionLabel] = useState("");
	const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
		null,
	);
	const { screenToFlowPosition } = useReactFlow();
	const containerRef = useRef<HTMLDivElement>(null);

	const {
		nodes,
		edges,
		selectedMissionId,
		setNodes,
		setEdges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		addMission,
	} = useCanvasStore();

	const { save, saveVersion, saveStatus, lastSavedAt } = useSaveGraph(
		currentVersionId,
		(id) => {
			setCurrentVersionId(id);
			setVersionLabel("");
			setModal(null);
		},
	);

	const { data: graphResult } = useQuery({
		queryKey: ["graph"],
		queryFn: () => loadCurrentGraph(),
	});

	const { data: characters = [] } = useQuery({
		queryKey: ["characters"],
		queryFn: () => getCharacters(),
	});

	const { data: buildings = [] } = useQuery({
		queryKey: ["buildings"],
		queryFn: () => getBuildings(),
	});

	const [templateCopied, setTemplateCopied] = useState(false);
	const [jsonCopied, setJsonCopied] = useState(false);

	const copyCurrentJson = useCallback(() => {
		const { nodes: n, edges: e } = useCanvasStore.getState();
		const data = buildGraphData(n, e);
		navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
			setJsonCopied(true);
			setTimeout(() => setJsonCopied(false), 2000);
		});
	}, []);
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1_000);
		return () => clearInterval(t);
	}, []);

	const elapsed = lastSavedAt
		? Math.floor((now - lastSavedAt.getTime()) / 1000)
		: null;
	const elapsedLabel =
		elapsed === null
			? null
			: elapsed < 60
				? `${elapsed}s ago`
				: elapsed < 3600
					? `${Math.floor(elapsed / 60)}m ago`
					: `${Math.floor(elapsed / 3600)}h ago`;

	const copyTemplate = useCallback(() => {
		const charList = characters.length
			? characters
					.map((c) => `//   { id: "${c.id}", name: "${c.name}" }`)
					.join("\n")
			: '//   (none yet — use "" for speakerId, assign via dropdown after adding characters)';
		const bldList = buildings.length
			? buildings
					.map((b) => `//   { id: "${b.id}", name: "${b.buildingName}" }`)
					.join("\n")
			: "//   (none yet — use null for random building)";

		const m1 = crypto.randomUUID();
		const m2 = crypto.randomUUID();
		const m3 = crypto.randomUUID();
		const m4 = crypto.randomUUID();
		const s1 = crypto.randomUUID();
		const s2 = crypto.randomUUID();
		const s3 = crypto.randomUUID();
		const s4 = crypto.randomUUID();
		const s5 = crypto.randomUUID();
		const s6 = crypto.randomUUID();
		const d1 = crypto.randomUUID();
		const d2 = crypto.randomUUID();
		const d3 = crypto.randomUUID();
		const d4 = crypto.randomUUID();
		const e1 = crypto.randomUUID();
		const e2 = crypto.randomUUID();
		const e3 = crypto.randomUUID();

		const speakerId = characters[0]?.id ?? "";
		const speaker2Id = characters[1]?.id ?? speakerId;
		const bld0 = buildings[0]?.id ? `"${buildings[0].id}"` : "null";
		const bld1 = buildings[1]?.id ? `"${buildings[1].id}"` : bld0;

		const template = `// ════════════════════════════════════════════════════════════════
// ChillTown Mission Graph — LLM Generation Template
// ════════════════════════════════════════════════════════════════
// OUTPUT: Return raw JSON only — no markdown fences, no comments.
// Replace ALL placeholder names/text with your own story content.
// Generate as many missions as the story needs (10–20 is typical).
// Every "id" field must be a unique UUID v4 that YOU generate.
//
// ── AVAILABLE CHARACTERS ─────────────────────────────────────────
// speakerId in dialogues must be one of these IDs.
// Use "" if the list is empty — it will show a "Select speaker" dropdown later.
${charList}
//
// ── AVAILABLE BUILDINGS ──────────────────────────────────────────
// targetBuildingId in stages must be one of these IDs, or null (= random building).
${bldList}
//
// ════════════════════════════════════════════════════════════════
// MISSION TYPES
// ════════════════════════════════════════════════════════════════
//   "Story" — main campaign missions, form the critical path
//   "Side"  — optional side missions, can be fully independent chains
//   "Base"  — reserved
//
// ════════════════════════════════════════════════════════════════
// STAGE TYPES  (a mission can have ANY number of stages in any order)
// ════════════════════════════════════════════════════════════════
//   "Dialogue" — conversation stage
//       dialogues: one or more { id, speakerId, text } lines (back-and-forth is fine)
//       targetBuildingId: null
//       cargoWeight: 0 / timeLimit: 0
//
//   "Pickup" — player picks up cargo at a building
//       cargoWeight: > 0 (kg)
//       targetBuildingId: building id or null for random
//       dialogues: optional — add lines to play before/during the pickup
//       timeLimit: 0
//
//   "Drop" — player delivers cargo to a building
//       timeLimit: seconds to complete (0 = no limit)
//       targetBuildingId: building id or null for random
//       dialogues: optional — add lines to play on arrival/delivery
//       cargoWeight: 0
//
//   You can chain multiple Pickup and Drop stages inside one mission.
//   Example: Pickup → Dialogue → Drop → Pickup → Drop  (all in one mission).
//
// ════════════════════════════════════════════════════════════════
// GRAPH / PREREQUISITE RULES  (READ CAREFULLY)
// ════════════════════════════════════════════════════════════════
//   prerequisites: ALWAYS leave as [] in every mission object.
//   The EDGES array is the sole source of graph connections.
//
//   An edge { source: A, target: B } means:
//     "Mission A must be completed before Mission B unlocks."
//
//   A mission can have MULTIPLE prerequisites:
//     If edges contain  A→C  and  B→C,  then C only unlocks when BOTH A and B are done.
//     Use this for convergence points (e.g. a finale that requires two questlines).
//
//   A mission can unlock MULTIPLE successors:
//     If edges contain  A→B  and  A→C,  both B and C unlock when A is done.
//     Use this to branch the story after a key event.
//
//   Side missions can be FULLY INDEPENDENT — no edge connecting them to Story missions.
//     Give them positionY values well above or below the main chain so the canvas is readable.
//
//   Side missions can also be TRIGGERED BY story missions:
//     Add an edge  StoryMission→SideMission  to gate a side quest behind story progress.
//
//   positionX/positionY: lay the graph out left-to-right.
//     Main Story chain: positionY = 0, positionX stepping by ~450 per mission.
//     Side chains branching down: positionY = 400 or 800, independent X origin.
//     Convergence missions: place between the two incoming missions' X positions.
//
// ════════════════════════════════════════════════════════════════
// EXAMPLE (4 missions showing branching + convergence + side chain)
// ════════════════════════════════════════════════════════════════
//
//   [Story01] ──► [Story02] ──► [Story03 — requires Story02 AND Side01]
//                                    ▲
//   [Side01 — independent] ──────────┘
//
//   Edges: Story01→Story02, Story02→Story03, Side01→Story03

{
  "missions": [
    {
      "id": "${m1}",
      "missionName": "Story Mission 01",
      "description": "Opening story mission. No prerequisites.",
      "missionType": "Story",
      "prerequisites": [],
      "stages": [
        {
          "id": "${s1}",
          "stageType": "Dialogue",
          "targetBuildingId": null,
          "statusMessage": "Talk to the contact",
          "dialogues": [
            { "id": "${d1}", "speakerId": "${speakerId}", "text": "We have a job for you." },
            { "id": "${d2}", "speakerId": "${speaker2Id}", "text": "I'm listening." }
          ],
          "cargoWeight": 0,
          "timeLimit": 0
        },
        {
          "id": "${s2}",
          "stageType": "Pickup",
          "targetBuildingId": ${bld0},
          "statusMessage": "Pick up the package",
          "dialogues": [
            { "id": "${d3}", "speakerId": "${speakerId}", "text": "It's all yours. Don't drop it." }
          ],
          "cargoWeight": 15,
          "timeLimit": 0
        },
        {
          "id": "${s3}",
          "stageType": "Drop",
          "targetBuildingId": ${bld1},
          "statusMessage": "Deliver to the warehouse",
          "dialogues": [
            { "id": "${d4}", "speakerId": "${speaker2Id}", "text": "Good work. Meet me inside." }
          ],
          "cargoWeight": 0,
          "timeLimit": 90
        }
      ],
      "positionX": 0,
      "positionY": 0
    },
    {
      "id": "${m2}",
      "missionName": "Story Mission 02",
      "description": "Unlocks after Story 01.",
      "missionType": "Story",
      "prerequisites": [],
      "stages": [
        {
          "id": "${s4}",
          "stageType": "Dialogue",
          "targetBuildingId": null,
          "statusMessage": "Debrief",
          "dialogues": [],
          "cargoWeight": 0,
          "timeLimit": 0
        }
      ],
      "positionX": 450,
      "positionY": 0
    },
    {
      "id": "${m3}",
      "missionName": "Side Mission 01 (independent chain)",
      "description": "A self-contained side quest. Not connected to the main story.",
      "missionType": "Side",
      "prerequisites": [],
      "stages": [
        {
          "id": "${s5}",
          "stageType": "Pickup",
          "targetBuildingId": ${bld0},
          "statusMessage": "Grab the contraband",
          "dialogues": [],
          "cargoWeight": 8,
          "timeLimit": 0
        },
        {
          "id": "${s6}",
          "stageType": "Drop",
          "targetBuildingId": ${bld1},
          "statusMessage": "Drop it off quietly",
          "dialogues": [],
          "cargoWeight": 0,
          "timeLimit": 60
        }
      ],
      "positionX": 0,
      "positionY": 450
    },
    {
      "id": "${m4}",
      "missionName": "Story Mission 03 (convergence)",
      "description": "Requires BOTH Story 02 AND Side 01 to be completed first.",
      "missionType": "Story",
      "prerequisites": [],
      "stages": [],
      "positionX": 900,
      "positionY": 0
    }
  ],
  "edges": [
    { "id": "${e1}", "source": "${m1}", "target": "${m2}" },
    { "id": "${e2}", "source": "${m2}", "target": "${m4}" },
    { "id": "${e3}", "source": "${m3}", "target": "${m4}" }
  ]
}`;

		navigator.clipboard.writeText(template).then(() => {
			setTemplateCopied(true);
			setTimeout(() => setTemplateCopied(false), 2000);
		});
	}, [characters, buildings]);

	// Reload canvas whenever the current graph changes (including after Set as Current)
	const loadedIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (!graphResult) return;
		// Always reload if the version id changed (covers first load + Set as Current)
		if (graphResult.id === loadedIdRef.current) return;
		loadedIdRef.current = graphResult.id;
		setCurrentVersionId(graphResult.id);
		setNodes(
			graphResult.data.missions.map((m) => ({
				id: m.id,
				type: "mission" as const,
				position: { x: m.positionX, y: m.positionY },
				data: m,
			})) as Parameters<typeof setNodes>[0],
		);
		setEdges(
			graphResult.data.edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		);
	}, [graphResult, setNodes, setEdges]);

	const handleSaveClick = () => {
		if (!currentVersionId) {
			setModal("saveVersion");
		} else {
			save();
		}
	};

	const handleVersionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!versionLabel.trim()) return;
		saveVersion(versionLabel.trim());
	};

	const onPaneContextMenu = useCallback(
		(e: MouseEvent | React.MouseEvent) => {
			e.preventDefault();
			const bounds = containerRef.current?.getBoundingClientRect();
			const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
			setContextMenu({
				x: e.clientX - (bounds?.left ?? 0),
				y: e.clientY - (bounds?.top ?? 0),
				flowX: flowPos.x,
				flowY: flowPos.y,
			});
		},
		[screenToFlowPosition],
	);

	const closeContextMenu = useCallback(() => setContextMenu(null), []);

	const createMission = useCallback(() => {
		if (!contextMenu) return;
		const mission: Mission = {
			id: crypto.randomUUID(),
			missionName: "New Mission",
			description: "",
			missionType: "Side",
			prerequisites: [],
			stages: [],
			positionX: contextMenu.flowX,
			positionY: contextMenu.flowY,
		};
		addMission(mission);
		closeContextMenu();
	}, [contextMenu, addMission, closeContextMenu]);

	const handleNodesChange = useCallback(
		(changes: NodeChange<Node<MissionNodeData>>[]) => {
			const removes = changes.filter((c) => c.type === "remove");
			const others = changes.filter((c) => c.type !== "remove");
			if (others.length) onNodesChange(others);
			if (removes.length) {
				const names = removes
					.map(
						(c) =>
							nodes.find((n) => n.id === c.id)?.data.missionName ?? "Mission",
					)
					.join(", ");
				const label =
					removes.length === 1
						? `Delete mission "${names}"?`
						: `Delete ${removes.length} missions (${names})?`;
				setPendingDelete({ type: "nodes", label, nodeChanges: removes });
			}
		},
		[nodes, onNodesChange],
	);

	const handleEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const removes = changes.filter((c) => c.type === "remove");
			const others = changes.filter((c) => c.type !== "remove");
			if (others.length) onEdgesChange(others);
			if (removes.length) {
				const label =
					removes.length === 1
						? "Remove this connection?"
						: `Remove ${removes.length} connections?`;
				setPendingDelete({ type: "edges", label, edgeChanges: removes });
			}
		},
		[onEdgesChange],
	);

	const confirmPendingDelete = useCallback(() => {
		if (!pendingDelete) return;
		if (pendingDelete.nodeChanges) onNodesChange(pendingDelete.nodeChanges);
		if (pendingDelete.edgeChanges) onEdgesChange(pendingDelete.edgeChanges);
		setPendingDelete(null);
	}, [pendingDelete, onNodesChange, onEdgesChange]);

	const memoizedNodeTypes = useMemo(() => nodeTypes, []);

	return (
		<div
			className="flex h-screen flex-col"
			style={{ background: "var(--surface-0)" }}
		>
			{/* Top bar */}
			<div
				className="flex h-13 shrink-0 items-center justify-between px-5"
				style={{
					borderBottom: "1px solid var(--border)",
					background: "rgba(8,10,14,0.95)",
				}}
			>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2.5">
							<div
								className="flex h-6 w-6 items-center justify-center rounded-md"
								style={{
									background: "rgba(59,130,246,0.15)",
									border: "1px solid rgba(59,130,246,0.2)",
								}}
							>
								<span className="font-mono-game text-[9px] font-bold text-blue-400">
									CT
								</span>
							</div>
							<span
								className="font-mono-game text-xs font-semibold uppercase tracking-widest"
								style={{ color: "#475569" }}
							>
								Story Creator
							</span>
						</div>
						<Link
							to="/"
							className="font-mono-game flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider transition-colors"
							style={{ color: "#334155" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = "#94a3b8";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "#334155";
							}}
						>
							<span>←</span>
							<span>Home</span>
						</Link>
						<Link
							to="/writer"
							className="font-mono-game flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider transition-colors"
							style={{ color: "#334155" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = "#94a3b8";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "#334155";
							}}
						>
							<span>Story Writer</span>
							<span>→</span>
						</Link>
					</div>
					{!currentVersionId ? (
						<span
							className="font-mono-game text-[10px] tracking-wide"
							style={{ color: "#f59e0b", opacity: 0.8 }}
						>
							● unsaved
						</span>
					) : saveStatus === "saving" ? (
						<span
							className="font-mono-game text-[10px] tracking-wide"
							style={{ color: "#64748b" }}
						>
							● saving…
						</span>
					) : saveStatus === "saved" ? (
						<span
							className="font-mono-game text-[10px] tracking-wide"
							style={{ color: "#34d399" }}
						>
							✓ saved
						</span>
					) : elapsedLabel ? (
						<span
							className="font-mono-game text-[10px] tracking-wide"
							style={{ color: "#ef4444" }}
						>
							⚠ last saved {elapsedLabel}
						</span>
					) : null}
				</div>

				<div className="flex items-center gap-2">
					{[
						{
							key: "characters",
							label: "Characters",
							icon: Users,
							color: "#a78bfa",
						},
						{
							key: "buildings",
							label: "Buildings",
							icon: Building2,
							color: "#34d399",
						},
						{
							key: "versions",
							label: "Versions",
							icon: GitBranch,
							color: "#64748b",
						},
						{
							key: "help",
							label: "Help",
							icon: HelpCircle,
							color: "#94a3b8",
						},
					].map(({ key, label, icon: Icon, color }) => (
						<button
							key={key}
							type="button"
							onClick={() => setModal(key as Modal)}
							className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
							style={{
								color: "#475569",
								border: "1px solid rgba(255,255,255,0.06)",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = color;
								e.currentTarget.style.borderColor = `${color}30`;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "#475569";
								e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
							}}
						>
							<Icon className="h-3.5 w-3.5" />
							{label}
						</button>
					))}
					<button
						type="button"
						onClick={copyTemplate}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
						style={{
							color: templateCopied ? "#34d399" : "#475569",
							border: `1px solid ${templateCopied ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`,
						}}
					>
						{templateCopied ? (
							<ClipboardCheck className="h-3.5 w-3.5" />
						) : (
							<Clipboard className="h-3.5 w-3.5" />
						)}
						{templateCopied ? "Copied!" : "Copy Template"}
					</button>
					<button
						type="button"
						onClick={copyCurrentJson}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
						style={{
							color: jsonCopied ? "#34d399" : "#475569",
							border: `1px solid ${jsonCopied ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`,
						}}
					>
						{jsonCopied ? (
							<ClipboardCheck className="h-3.5 w-3.5" />
						) : (
							<Clipboard className="h-3.5 w-3.5" />
						)}
						{jsonCopied ? "Copied!" : "Copy Story JSON"}
					</button>
					<button
						type="button"
						onClick={() => setModal("importJson")}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
						style={{
							color: "#475569",
							border: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						Import JSON
					</button>
					<button
						type="button"
						onClick={handleSaveClick}
						disabled={saveStatus === "saving"}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
						style={{
							background: "rgba(59,130,246,0.15)",
							color: "#60a5fa",
							border: "1px solid rgba(59,130,246,0.3)",
						}}
					>
						<Save className="h-3.5 w-3.5" />
						Save
					</button>
				</div>
			</div>

			{/* Canvas + side panel */}
			<div className="flex flex-1 overflow-hidden">
				<div ref={containerRef} className="relative flex-1">
					<ReactFlow
						nodes={nodes}
						edges={edges}
						nodeTypes={memoizedNodeTypes}
						onNodesChange={handleNodesChange}
						onEdgesChange={handleEdgesChange}
						onConnect={onConnect}
						onPaneClick={closeContextMenu}
						onPaneContextMenu={onPaneContextMenu}
						onMove={closeContextMenu}
						deleteKeyCode={["Backspace", "Delete"]}
						fitView
						colorMode="dark"
					>
						<Background
							variant={BackgroundVariant.Dots}
							gap={24}
							size={1}
							color="rgba(255,255,255,0.04)"
						/>
						<Controls />
						<MiniMap
							nodeColor={(n) => {
								const type = (n.data as { missionType?: string }).missionType;
								if (type === "Story") return "#3b82f6";
								if (type === "Side") return "#f59e0b";
								return "#22c55e";
							}}
							maskColor="rgba(0,0,0,0.6)"
							style={{
								background: "#0d1017",
								border: "1px solid rgba(255,255,255,0.06)",
								borderRadius: 8,
							}}
						/>
					</ReactFlow>

					{contextMenu && (
						<div
							style={{
								top: contextMenu.y,
								left: contextMenu.x,
								background: "linear-gradient(160deg, #111520, #0d1017)",
								border: "1px solid rgba(255,255,255,0.1)",
								boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
							}}
							className="absolute z-50 min-w-48 overflow-hidden rounded-xl py-1.5"
						>
							<button
								type="button"
								onClick={createMission}
								className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium transition-colors hover:bg-white/5"
								style={{ color: "#94a3b8" }}
							>
								<span className="font-mono-game text-blue-400">+</span>
								New Mission
							</button>
						</div>
					)}
				</div>

				{selectedMissionId && <MissionPanel />}
			</div>

			{modal === "help" && <HelpModal onClose={() => setModal(null)} />}
			{modal === "characters" && (
				<CharactersModal onClose={() => setModal(null)} />
			)}
			{modal === "buildings" && (
				<BuildingsModal onClose={() => setModal(null)} />
			)}
			{modal === "versions" && (
				<VersionsModal
					onClose={() => setModal(null)}
					onNewVersion={(id) => {
						setCurrentVersionId(id);
						setModal(null);
					}}
				/>
			)}
			{modal === "importJson" && (
				<ImportJsonModal
					onClose={() => setModal(null)}
					onImport={(data) => {
						setNodes(
							data.missions.map((m) => ({
								id: m.id,
								type: "mission" as const,
								position: { x: m.positionX, y: m.positionY },
								data: m,
							})) as Parameters<typeof setNodes>[0],
						);
						setEdges(
							data.edges.map((e) => ({
								id: e.id,
								source: e.source,
								target: e.target,
							})),
						);
						setModal(null);
					}}
				/>
			)}

			{modal === "saveVersion" && (
				<div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70">
					<div
						className="flex w-full max-w-sm flex-col gap-5 rounded-2xl p-6 shadow-2xl"
						style={{
							background: "linear-gradient(160deg, #111520, #0d1017)",
							border: "1px solid rgba(255,255,255,0.08)",
						}}
					>
						<div className="flex items-center gap-3">
							<div
								className="h-1.5 w-1.5 rounded-full"
								style={{ background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }}
							/>
							<h2
								className="font-mono-game text-xs font-semibold uppercase tracking-widest"
								style={{ color: "#94a3b8" }}
							>
								Save Snapshot
							</h2>
						</div>
						<form
							onSubmit={handleVersionSubmit}
							className="flex flex-col gap-3"
						>
							<div className="flex flex-col gap-1.5">
								<span
									className="text-[11px] font-medium uppercase tracking-wider"
									style={{ color: "#475569" }}
								>
									Label
								</span>
								<input
									className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#080a0e] px-3 py-2 text-sm text-white placeholder-[#2d3748] focus:border-[rgba(255,255,255,0.15)] focus:outline-none transition-colors"
									placeholder="e.g. Chapter 2 draft"
									value={versionLabel}
									onChange={(e) => setVersionLabel(e.target.value)}
									required
								/>
							</div>
							<div className="flex gap-2">
								<button
									type="submit"
									className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
									style={{
										background: "rgba(59,130,246,0.15)",
										color: "#60a5fa",
										border: "1px solid rgba(59,130,246,0.3)",
									}}
								>
									Save
								</button>
								<button
									type="button"
									onClick={() => setModal(null)}
									className="rounded-lg px-4 py-2 text-xs transition-colors hover:bg-white/5"
									style={{
										color: "#475569",
										border: "1px solid rgba(255,255,255,0.06)",
									}}
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{pendingDelete && (
				<ConfirmDialog
					message={pendingDelete.label}
					onConfirm={confirmPendingDelete}
					onCancel={() => setPendingDelete(null)}
				/>
			)}
		</div>
	);
}
