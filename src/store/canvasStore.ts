import type {
	Connection,
	Edge,
	EdgeChange,
	Node,
	NodeChange,
} from "@xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { create } from "zustand";
import type { Mission } from "#/types/mission";

export type MissionNodeData = Mission & Record<string, unknown>;

interface CanvasStore {
	nodes: Node<MissionNodeData>[];
	edges: Edge[];
	selectedMissionId: string | null;

	setNodes: (nodes: Node<MissionNodeData>[]) => void;
	setEdges: (edges: Edge[]) => void;
	onNodesChange: (changes: NodeChange<Node<MissionNodeData>>[]) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
	onConnect: (connection: Connection) => void;
	selectMission: (id: string | null) => void;
	addMission: (mission: Mission) => void;
	updateMission: (id: string, patch: Partial<Mission>) => void;
	deleteMission: (id: string) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
	nodes: [],
	edges: [],
	selectedMissionId: null,

	setNodes: (nodes) => set({ nodes }),
	setEdges: (edges) => set({ edges }),

	onNodesChange: (changes) =>
		set((s) => {
			const removedIds = new Set(
				changes.filter((c) => c.type === "remove").map((c) => c.id),
			);
			return {
				nodes: applyNodeChanges(changes, s.nodes),
				selectedMissionId:
					s.selectedMissionId && removedIds.has(s.selectedMissionId)
						? null
						: s.selectedMissionId,
			};
		}),

	onEdgesChange: (changes) =>
		set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

	onConnect: (connection) =>
		set((s) => ({ edges: addEdge(connection, s.edges) })),

	selectMission: (id) => set({ selectedMissionId: id }),

	addMission: (mission) =>
		set((s) => ({
			nodes: [
				...s.nodes,
				{
					id: mission.id,
					type: "mission",
					position: { x: mission.positionX, y: mission.positionY },
					data: mission as MissionNodeData,
				},
			],
		})),

	updateMission: (id, patch) =>
		set((s) => ({
			nodes: s.nodes.map((n) =>
				n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
			),
		})),

	deleteMission: (id) =>
		set((s) => ({
			nodes: s.nodes.filter((n) => n.id !== id),
			edges: s.edges.filter((e) => e.source !== id && e.target !== id),
			selectedMissionId:
				s.selectedMissionId === id ? null : s.selectedMissionId,
		})),
}));
