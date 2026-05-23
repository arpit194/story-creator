import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Building2,
	Clipboard,
	ClipboardCheck,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import {
	createBuilding,
	deleteBuilding,
	getBuildings,
	updateBuilding,
} from "#/server/buildings";
import type { Building } from "#/types/mission";

interface Props {
	onClose: () => void;
}

function toUnityId(name: string): string {
	return name
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
}

export function BuildingsModal({ onClose }: Props) {
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [editing, setEditing] = useState<Building | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<Building | null>(null);
	const [copied, setCopied] = useState(false);

	function copyJson(buildings: Building[]) {
		const unity = buildings.map((b) => ({
			id: toUnityId(b.buildingName),
			name: b.buildingName,
		}));
		navigator.clipboard.writeText(JSON.stringify(unity, null, 2)).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}

	const { data: buildings = [] } = useQuery({
		queryKey: ["buildings"],
		queryFn: () => getBuildings(),
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: ["buildings"] });

	const createMut = useMutation({
		mutationFn: (buildingName: string) =>
			createBuilding({ data: { buildingName } }),
		onSuccess: () => {
			invalidate();
			setName("");
		},
	});
	const updateMut = useMutation({
		mutationFn: ({ id, buildingName }: { id: string; buildingName: string }) =>
			updateBuilding({ data: { id, buildingName } }),
		onSuccess: () => {
			invalidate();
			setEditing(null);
			setName("");
		},
	});
	const deleteMut = useMutation({
		mutationFn: (id: string) => deleteBuilding({ data: { id } }),
		onSuccess: invalidate,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		editing
			? updateMut.mutate({ id: editing.id, buildingName: name.trim() })
			: createMut.mutate(name.trim());
	};

	const startEdit = (b: Building) => {
		setEditing(b);
		setName(b.buildingName);
	};
	const cancelEdit = () => {
		setEditing(null);
		setName("");
	};

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
								style={{ background: "#34d399", boxShadow: "0 0 10px #34d399" }}
							/>
							<h2
								className="font-mono-game text-sm font-semibold uppercase tracking-widest"
								style={{ color: "#94a3b8" }}
							>
								Buildings
							</h2>
							<span
								className="font-mono-game rounded-md px-2 py-0.5 text-[10px] font-semibold"
								style={{
									background: "rgba(52,211,153,0.1)",
									color: "#34d399",
									border: "1px solid rgba(52,211,153,0.2)",
								}}
							>
								{buildings.length}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => copyJson(buildings)}
								className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
								style={{
									color: copied ? "#34d399" : "#475569",
									border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`,
								}}
							>
								{copied ? (
									<ClipboardCheck className="h-3.5 w-3.5" />
								) : (
									<Clipboard className="h-3.5 w-3.5" />
								)}
								{copied ? "Copied!" : "Copy JSON"}
							</button>
							<button
								type="button"
								onClick={onClose}
								className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
								style={{ color: "#475569" }}
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Form */}
					<div className="px-8 pb-5">
						<form onSubmit={handleSubmit}>
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
									{editing
										? `Editing: ${editing.buildingName}`
										: "New Building"}
								</p>
								<div className="flex gap-3">
									<input
										className={inputCls}
										placeholder="e.g. City Hall"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
									<button
										type="submit"
										disabled={createMut.isPending || updateMut.isPending}
										className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40"
										style={{
											background: "rgba(52,211,153,0.12)",
											color: "#34d399",
											border: "1px solid rgba(52,211,153,0.25)",
										}}
									>
										<Plus className="h-3.5 w-3.5" />
										{editing ? "Update" : "Add"}
									</button>
									{editing && (
										<button
											type="button"
											onClick={cancelEdit}
											className="shrink-0 rounded-lg px-4 py-2 text-xs transition-colors hover:bg-white/5"
											style={{
												color: "#475569",
												border: "1px solid rgba(255,255,255,0.06)",
											}}
										>
											Cancel
										</button>
									)}
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
						{buildings.length === 0 && (
							<div className="flex flex-col items-center gap-3 py-12">
								<Building2 className="h-8 w-8" style={{ color: "#1e293b" }} />
								<p className="text-sm" style={{ color: "#334155" }}>
									No buildings yet — add one above
								</p>
							</div>
						)}
						<div className="grid grid-cols-3 gap-3">
							{buildings.map((b) => (
								<div
									key={b.id}
									className="group flex items-center justify-between gap-2 rounded-xl px-4 py-3.5 transition-colors"
									style={{
										background:
											editing?.id === b.id
												? "rgba(52,211,153,0.06)"
												: "rgba(255,255,255,0.02)",
										border: `1px solid ${editing?.id === b.id ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.05)"}`,
									}}
								>
									<p className="font-mono-game min-w-0 truncate text-sm font-medium text-white">
										{b.buildingName}
									</p>
									<div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											type="button"
											onClick={() => startEdit(b)}
											className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
											style={{ color: "#475569" }}
										>
											<Pencil className="h-3 w-3" />
										</button>
										<button
											type="button"
											onClick={() => setConfirmDelete(b)}
											className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
											style={{ color: "#475569" }}
										>
											<Trash2 className="h-3 w-3" />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{confirmDelete && (
				<ConfirmDialog
					message={`"${confirmDelete.buildingName}" will be permanently removed.`}
					onConfirm={() => {
						deleteMut.mutate(confirmDelete.id);
						setConfirmDelete(null);
					}}
					onCancel={() => setConfirmDelete(null)}
				/>
			)}
		</>
	);
}

const inputCls =
	"flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#080a0e] px-3 py-2 text-sm text-white placeholder-[#2d3748] focus:border-[rgba(255,255,255,0.15)] focus:outline-none transition-colors";
