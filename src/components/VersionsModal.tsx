import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2,
	Clock,
	GitBranch,
	History,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import {
	deleteGraphVersion,
	listGraphVersions,
	saveGraphVersion,
	setCurrentVersion,
} from "#/server/graph";
import { useCanvasStore } from "#/store/canvasStore";
import type { Mission } from "#/types/mission";

interface Props {
	onClose: () => void;
	onNewVersion: (id: string) => void;
}

function buildGraphData(
	nodes: ReturnType<typeof useCanvasStore.getState>["nodes"],
	edges: ReturnType<typeof useCanvasStore.getState>["edges"],
) {
	const prerequisiteMap = new Map<string, string[]>();
	for (const e of edges) {
		prerequisiteMap.set(e.target, [
			...(prerequisiteMap.get(e.target) ?? []),
			e.source,
		]);
	}
	return {
		missions: nodes.map((n) => ({
			...(n.data as Mission),
			positionX: n.position.x,
			positionY: n.position.y,
			prerequisites: prerequisiteMap.get(n.id) ?? [],
		})),
		edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
	};
}

export function VersionsModal({ onClose, onNewVersion }: Props) {
	const qc = useQueryClient();
	const { nodes, edges } = useCanvasStore();
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [label, setLabel] = useState("");

	const { data: versions = [] } = useQuery({
		queryKey: ["graph-versions"],
		queryFn: () => listGraphVersions(),
	});

	const setCurrent = useMutation({
		mutationFn: (id: string) => setCurrentVersion({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["graph-versions"] });
			qc.invalidateQueries({ queryKey: ["graph"] });
			setConfirmId(null);
		},
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => deleteGraphVersion({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["graph-versions"] });
			qc.invalidateQueries({ queryKey: ["graph"] });
			setDeleteId(null);
		},
	});

	const snapshot = useMutation({
		mutationFn: (l: string) =>
			saveGraphVersion({
				data: { data: buildGraphData(nodes, edges), label: l },
			}),
		onSuccess: (row) => {
			qc.invalidateQueries({ queryKey: ["graph-versions"] });
			qc.invalidateQueries({ queryKey: ["graph"] });
			onNewVersion(row.id);
			setLabel("");
		},
	});

	const handleSnapshot = (e: React.FormEvent) => {
		e.preventDefault();
		if (!label.trim()) return;
		snapshot.mutate(label.trim());
	};

	const confirmVersion = versions.find((v) => v.id === confirmId);

	return (
		<>
			<div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
				<div
					className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl"
					style={{
						background: "linear-gradient(160deg, #111520, #0d1017)",
						border: "1px solid rgba(255,255,255,0.08)",
						maxHeight: "85vh",
					}}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-8 pt-7 pb-5">
						<div className="flex items-center gap-3">
							<div
								className="h-2 w-2 rounded-full"
								style={{ background: "#64748b", boxShadow: "0 0 10px #64748b" }}
							/>
							<h2
								className="font-mono-game text-sm font-semibold uppercase tracking-widest"
								style={{ color: "#94a3b8" }}
							>
								Versions
							</h2>
							<span
								className="font-mono-game rounded-md px-2 py-0.5 text-[10px] font-semibold"
								style={{
									background: "rgba(100,116,139,0.12)",
									color: "#64748b",
									border: "1px solid rgba(100,116,139,0.2)",
								}}
							>
								{versions.length}
							</span>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
							style={{ color: "#475569" }}
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* New snapshot form */}
					<div className="px-8 pb-5">
						<form onSubmit={handleSnapshot}>
							<div
								className="rounded-xl p-4"
								style={{
									background: "rgba(255,255,255,0.02)",
									border: "1px solid rgba(255,255,255,0.06)",
								}}
							>
								<p
									className="mb-3 text-[11px] font-semibold uppercase tracking-wider"
									style={{ color: "#475569" }}
								>
									Save snapshot
								</p>
								<div className="flex gap-3">
									<input
										className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#080a0e] px-3 py-2 text-sm text-white placeholder-[#2d3748] focus:border-[rgba(255,255,255,0.15)] focus:outline-none transition-colors"
										placeholder="Snapshot label…"
										value={label}
										onChange={(e) => setLabel(e.target.value)}
									/>
									<button
										type="submit"
										disabled={!label.trim() || snapshot.isPending}
										className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40"
										style={{
											background: "rgba(59,130,246,0.15)",
											color: "#60a5fa",
											border: "1px solid rgba(59,130,246,0.3)",
										}}
									>
										<GitBranch className="h-3.5 w-3.5" />
										Save
									</button>
								</div>
							</div>
						</form>
					</div>

					<div
						className="mx-8 h-px"
						style={{ background: "rgba(255,255,255,0.06)" }}
					/>

					{/* Card grid */}
					<div className="overflow-y-auto px-8 py-5">
						{versions.length === 0 && (
							<div className="flex flex-col items-center gap-3 py-12">
								<History className="h-8 w-8" style={{ color: "#1e293b" }} />
								<p className="text-sm" style={{ color: "#334155" }}>
									No saved versions yet
								</p>
							</div>
						)}
						<div className="grid grid-cols-2 gap-3">
							{versions.map((v) => (
								<div
									key={v.id}
									className="group flex flex-col gap-3 rounded-xl p-4 transition-colors"
									style={{
										background: v.isCurrent
											? "rgba(59,130,246,0.06)"
											: "rgba(255,255,255,0.02)",
										border: `1px solid ${v.isCurrent ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)"}`,
									}}
								>
									{/* Top row: label + current badge */}
									<div className="flex items-start justify-between gap-2">
										<div className="flex min-w-0 flex-1 items-center gap-2">
											{v.isCurrent && (
												<CheckCircle2
													className="h-3.5 w-3.5 shrink-0"
													style={{ color: "#3b82f6" }}
												/>
											)}
											<p
												className="font-mono-game truncate text-sm font-semibold"
												style={{ color: v.isCurrent ? "#60a5fa" : "#e2e8f0" }}
											>
												{v.label ?? "Untitled"}
											</p>
										</div>
										{v.isCurrent && (
											<span
												className="font-mono-game shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
												style={{
													background: "rgba(59,130,246,0.12)",
													color: "#3b82f6",
													border: "1px solid rgba(59,130,246,0.25)",
												}}
											>
												current
											</span>
										)}
									</div>

									{/* Timestamp */}
									<div
										className="flex items-center gap-1.5"
										style={{ color: "#334155" }}
									>
										<Clock className="h-3 w-3" />
										<span className="text-[11px]">
											{new Date(v.createdAt).toLocaleString()}
										</span>
									</div>

									{/* Actions */}
									<div
										className="flex items-center gap-2 border-t pt-3"
										style={{ borderColor: "rgba(255,255,255,0.05)" }}
									>
										{!v.isCurrent && (
											<button
												type="button"
												onClick={() => setConfirmId(v.id)}
												disabled={setCurrent.isPending}
												className="flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 hover:bg-blue-500/10"
												style={{
													color: "#475569",
													border: "1px solid rgba(255,255,255,0.08)",
												}}
											>
												Set Current
											</button>
										)}
										<button
											type="button"
											onClick={() => setDeleteId(v.id)}
											disabled={deleteMut.isPending}
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 disabled:opacity-40"
											style={{
												color: "#475569",
												border: "1px solid rgba(255,255,255,0.08)",
											}}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{confirmVersion && (
				<ConfirmDialog
					message={`Switch to "${confirmVersion.label ?? "Untitled"}"? The canvas will reload with that version's data.`}
					confirmLabel="Set as Current"
					onConfirm={() => setCurrent.mutate(confirmVersion.id)}
					onCancel={() => setConfirmId(null)}
				/>
			)}

			{deleteId && (
				<ConfirmDialog
					message={`Delete "${versions.find((v) => v.id === deleteId)?.label ?? "Untitled"}"? This cannot be undone.`}
					confirmLabel="Delete"
					onConfirm={() => deleteMut.mutate(deleteId)}
					onCancel={() => setDeleteId(null)}
				/>
			)}
		</>
	);
}
