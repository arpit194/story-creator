import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { getBuildings } from "#/server/buildings";
import { getCharacters } from "#/server/characters";
import { useCanvasStore } from "#/store/canvasStore";
import type {
	DialogueLine,
	Mission,
	MissionStage,
	MissionType,
	StageType,
} from "#/types/mission";

const MISSION_TYPES: MissionType[] = ["Story", "Side", "Base"];

const TYPE_COLOR: Record<string, string> = {
	Story: "#3b82f6",
	Side: "#f59e0b",
	Base: "#22c55e",
};

const STAGE_COLOR: Record<string, string> = {
	Dialogue: "#a78bfa",
	Pickup: "#34d399",
	Drop: "#fb7185",
};

const s = {
	muted: "#475569",
	dim: "#334155",
};

// Collapsible used at top-level (Prerequisites, Stages header row) — no padding
function Collapsible({
	label,
	count,
	children,
	defaultOpen = true,
}: {
	label: string;
	count?: number;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex w-full items-center justify-between py-1"
			>
				<div className="flex items-center gap-2">
					<span
						className="text-xs font-semibold uppercase tracking-widest"
						style={{ color: s.muted }}
					>
						{label}
					</span>
					{count !== undefined && (
						<span
							className="font-mono-game rounded px-1.5 py-0.5 text-[10px]"
							style={{ background: "rgba(255,255,255,0.05)", color: s.muted }}
						>
							{count}
						</span>
					)}
				</div>
				<ChevronDown
					className="h-3.5 w-3.5 transition-transform duration-200"
					style={{
						color: s.dim,
						transform: open ? "rotate(0deg)" : "rotate(-90deg)",
					}}
				/>
			</button>
			<div className={`collapsible-content ${open ? "expanded" : "collapsed"}`}>
				<div className="pt-2">{children}</div>
			</div>
		</div>
	);
}

// Collapsible used inside a card — header has horizontal padding to match card padding
function CardCollapsible({
	label,
	count,
	children,
	defaultOpen = true,
}: {
	label: string;
	count?: number;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex w-full items-center justify-between px-4 py-3"
			>
				<div className="flex items-center gap-2">
					<span
						className="text-xs font-semibold uppercase tracking-widest"
						style={{ color: s.muted }}
					>
						{label}
					</span>
					{count !== undefined && (
						<span
							className="font-mono-game rounded px-1.5 py-0.5 text-[10px]"
							style={{ background: "rgba(255,255,255,0.05)", color: s.muted }}
						>
							{count}
						</span>
					)}
				</div>
				<ChevronDown
					className="h-3.5 w-3.5 transition-transform duration-200"
					style={{
						color: s.dim,
						transform: open ? "rotate(0deg)" : "rotate(-90deg)",
					}}
				/>
			</button>
			<div className={`collapsible-content ${open ? "expanded" : "collapsed"}`}>
				<div className="px-4 pb-4 pt-0">{children}</div>
			</div>
		</div>
	);
}

export function MissionPanel() {
	const {
		nodes,
		edges,
		selectedMissionId,
		selectMission,
		updateMission,
		deleteMission,
	} = useCanvasStore();
	const mission = nodes.find((n) => n.id === selectedMissionId)?.data as
		| Mission
		| undefined;

	const [form, setForm] = useState<Mission | null>(null);
	const loadedIdRef = useRef<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		if (!mission) {
			setForm(null);
			loadedIdRef.current = null;
			return;
		}
		if (mission.id !== loadedIdRef.current) {
			setForm(mission);
			loadedIdRef.current = mission.id;
		}
	}, [mission]);

	const prerequisiteNames = edges
		.filter((e) => e.target === selectedMissionId)
		.flatMap((e) => {
			const name = (
				nodes.find((n) => n.id === e.source)?.data as Mission | undefined
			)?.missionName;
			return name ? [name] : [];
		});

	const { data: characters = [] } = useQuery({
		queryKey: ["characters"],
		queryFn: () => getCharacters(),
		enabled: !!selectedMissionId,
	});
	const { data: buildings = [] } = useQuery({
		queryKey: ["buildings"],
		queryFn: () => getBuildings(),
		enabled: !!selectedMissionId,
	});

	if (!form) return null;

	const accent = TYPE_COLOR[form.missionType] ?? "#64748b";

	const patch = (fields: Partial<Mission>) => {
		setForm((f) => (f ? { ...f, ...fields } : f));
		updateMission(form.id, fields);
	};

	const patchStage = (i: number, fields: Partial<MissionStage>) =>
		patch({
			stages: form.stages.map((st, idx) =>
				idx === i ? { ...st, ...fields } : st,
			),
		});

	const addStage = () =>
		patch({
			stages: [
				...form.stages,
				{
					id: crypto.randomUUID(),
					stageType: "Dialogue",
					targetBuildingId: null,
					statusMessage: "",
					dialogues: [],
					cargoWeight: 0,
					timeLimit: 0,
					audioComplete: false,
				},
			],
		});

	const removeStage = (i: number) =>
		patch({ stages: form.stages.filter((_, idx) => idx !== i) });

	const addDialogue = (si: number) =>
		patch({
			stages: form.stages.map((st, i) =>
				i === si
					? {
							...st,
							dialogues: [
								...st.dialogues,
								{ id: crypto.randomUUID(), speakerId: "", text: "" },
							],
						}
					: st,
			),
		});

	const patchDialogue = (
		si: number,
		li: number,
		fields: Partial<DialogueLine>,
	) =>
		patch({
			stages: form.stages.map((st, i) =>
				i === si
					? {
							...st,
							dialogues: st.dialogues.map((d, j) =>
								j === li ? { ...d, ...fields } : d,
							),
						}
					: st,
			),
		});

	const removeDialogue = (si: number, li: number) =>
		patch({
			stages: form.stages.map((st, i) =>
				i === si
					? { ...st, dialogues: st.dialogues.filter((_, j) => j !== li) }
					: st,
			),
		});

	return (
		<>
			<div
				className="flex h-full shrink-0 flex-col"
				style={{
					width: 420,
					background: "linear-gradient(180deg, #0d1017, #080a0e)",
					borderLeft: "1px solid var(--border)",
				}}
			>
				{/* Header */}
				<div
					className="flex shrink-0 items-center justify-between px-5 py-4"
					style={{ borderBottom: "1px solid var(--border)" }}
				>
					<div className="flex items-center gap-3">
						<div
							className="h-2 w-2 rounded-full"
							style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
						/>
						<span
							className="font-mono-game text-xs font-semibold uppercase tracking-widest"
							style={{ color: s.muted }}
						>
							Mission
						</span>
					</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setConfirmDelete(true)}
							className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
							style={{ color: s.dim }}
							title="Delete mission"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
						<button
							type="button"
							onClick={() => selectMission(null)}
							className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
							style={{ color: s.dim }}
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>

				{/* Body */}
				<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
					<div className="flex flex-col gap-3">
						<Field label="Mission Name">
							<input
								className={input}
								value={form.missionName}
								onChange={(e) => patch({ missionName: e.target.value })}
							/>
						</Field>

						<Field label="Type">
							<div className="flex gap-2">
								{MISSION_TYPES.map((t) => {
									const active = form.missionType === t;
									const c = TYPE_COLOR[t];
									return (
										<button
											key={t}
											type="button"
											onClick={() => patch({ missionType: t as MissionType })}
											className="font-mono-game flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150"
											style={{
												background: active ? `${c}18` : "transparent",
												border: `1px solid ${active ? `${c}50` : "var(--border-bright)"}`,
												color: active ? c : s.muted,
											}}
										>
											{t}
										</button>
									);
								})}
							</div>
						</Field>

						<Field label="Description">
							<textarea
								className={`${input} resize-none`}
								rows={3}
								value={form.description}
								onChange={(e) => patch({ description: e.target.value })}
								placeholder="What is this mission about?"
							/>
						</Field>
					</div>

					<Divider />

					<Collapsible label="Prerequisites" count={prerequisiteNames.length}>
						{prerequisiteNames.length === 0 ? (
							<p className="text-xs italic" style={{ color: s.dim }}>
								None — connect edges on the canvas
							</p>
						) : (
							<div className="flex flex-col gap-1.5">
								{prerequisiteNames.map((name) => (
									<div
										key={name}
										className="flex items-center gap-2 rounded-lg px-3 py-2"
										style={{
											background: "rgba(255,255,255,0.03)",
											border: "1px solid var(--border)",
										}}
									>
										<span
											className="h-1 w-1 shrink-0 rounded-full"
											style={{ background: "#334155" }}
										/>
										<span
											className="font-mono-game text-xs"
											style={{ color: "#94a3b8" }}
										>
											{name}
										</span>
									</div>
								))}
							</div>
						)}
					</Collapsible>

					<Divider />

					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span
									className="text-xs font-semibold uppercase tracking-widest"
									style={{ color: s.muted }}
								>
									Stages
								</span>
								<span
									className="font-mono-game rounded px-1.5 py-0.5 text-[10px]"
									style={{
										background: "rgba(255,255,255,0.05)",
										color: s.muted,
									}}
								>
									{form.stages.length}
								</span>
							</div>
							<button
								type="button"
								onClick={addStage}
								className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
								style={{ color: accent, border: `1px solid ${accent}25` }}
							>
								<Plus className="h-3 w-3" />
								Add Stage
							</button>
						</div>

						{form.stages.length === 0 && (
							<div
								className="flex items-center justify-center rounded-xl py-8 text-xs"
								style={{
									border: "1px dashed var(--border-bright)",
									color: s.dim,
								}}
							>
								No stages yet
							</div>
						)}

						{form.stages.map((stage, si) => (
							<StageCard
								key={stage.id}
								stage={stage}
								index={si}
								characters={characters}
								buildings={buildings}
								accent={accent}
								onPatch={(f) => patchStage(si, f)}
								onRemove={() => removeStage(si)}
								onAddDialogue={() => addDialogue(si)}
								onPatchDialogue={(li, f) => patchDialogue(si, li, f)}
								onRemoveDialogue={(li) => removeDialogue(si, li)}
							/>
						))}
					</div>
				</div>
			</div>

			{confirmDelete && (
				<ConfirmDialog
					message={`"${form.missionName}" will be permanently removed from the canvas.`}
					onConfirm={() => {
						deleteMission(form.id);
						selectMission(null);
					}}
					onCancel={() => setConfirmDelete(false)}
				/>
			)}
		</>
	);
}

interface StageCardProps {
	stage: MissionStage;
	index: number;
	characters: { id: string; name: string }[];
	buildings: { id: string; buildingName: string }[];
	accent: string;
	onPatch: (f: Partial<MissionStage>) => void;
	onRemove: () => void;
	onAddDialogue: () => void;
	onPatchDialogue: (li: number, f: Partial<DialogueLine>) => void;
	onRemoveDialogue: (li: number) => void;
}

function StageCard({
	stage,
	index,
	characters,
	buildings,
	onPatch,
	onRemove,
	onAddDialogue,
	onPatchDialogue,
	onRemoveDialogue,
}: StageCardProps) {
	const stageColor = STAGE_COLOR[stage.stageType] ?? "#64748b";
	const [confirmRemove, setConfirmRemove] = useState(false);
	const [confirmRemoveLine, setConfirmRemoveLine] = useState<number | null>(
		null,
	);

	return (
		<>
			<div
				className="overflow-hidden rounded-xl"
				style={{
					background: "var(--surface-2)",
					border: "1px solid var(--border-bright)",
				}}
			>
				<CardCollapsible
					label={`Stage ${index + 1} · ${stage.stageType}`}
					defaultOpen={true}
				>
					<div className="flex flex-col gap-3">
						{/* Audio complete */}
						<button
							type="button"
							onClick={() => onPatch({ audioComplete: !stage.audioComplete })}
							className="flex items-center gap-2 self-start rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
							style={{
								background: stage.audioComplete
									? "rgba(52,211,153,0.1)"
									: "var(--surface-3)",
								border: `1px solid ${stage.audioComplete ? "rgba(52,211,153,0.3)" : "var(--border)"}`,
								color: stage.audioComplete ? "#34d399" : "#475569",
							}}
						>
							<div
								className="flex h-3.5 w-3.5 items-center justify-center rounded"
								style={{
									background: stage.audioComplete ? "#34d399" : "transparent",
									border: `1.5px solid ${stage.audioComplete ? "#34d399" : "#334155"}`,
								}}
							>
								{stage.audioComplete && (
									<svg
										viewBox="0 0 10 8"
										className="h-2 w-2"
										fill="none"
										aria-hidden="true"
									>
										<path
											d="M1 4l3 3 5-6"
											stroke="#0d1017"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</div>
							Audio complete
						</button>

						{/* Type pills + delete */}
						<div className="flex gap-1.5">
							{(["Dialogue", "Pickup", "Drop"] as StageType[]).map((t) => {
								const c = STAGE_COLOR[t];
								const active = stage.stageType === t;
								return (
									<button
										key={t}
										type="button"
										onClick={() => onPatch({ stageType: t })}
										className="font-mono-game flex-1 rounded-lg py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all"
										style={{
											background: active ? `${c}15` : "transparent",
											border: `1px solid ${active ? `${c}40` : "var(--border)"}`,
											color: active ? c : "#334155",
										}}
									>
										{t}
									</button>
								);
							})}
							<button
								type="button"
								onClick={() => setConfirmRemove(true)}
								className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
								style={{ color: "#334155", border: "1px solid var(--border)" }}
							>
								<Trash2 className="h-3 w-3" />
							</button>
						</div>

						<Field label="Target Building">
							<select
								className={select}
								value={stage.targetBuildingId ?? ""}
								onChange={(e) =>
									onPatch({ targetBuildingId: e.target.value || null })
								}
							>
								<option value="">Random</option>
								{buildings.map((b) => (
									<option key={b.id} value={b.id}>
										{b.buildingName}
									</option>
								))}
							</select>
						</Field>

						<Field label="Status Message">
							<input
								className={input}
								placeholder="Shown in HUD during this stage"
								value={stage.statusMessage}
								onChange={(e) => onPatch({ statusMessage: e.target.value })}
							/>
						</Field>

						{stage.stageType === "Pickup" && (
							<Field label="Cargo Weight">
								<input
									type="number"
									min={0}
									className={input}
									value={stage.cargoWeight}
									onChange={(e) =>
										onPatch({ cargoWeight: Number(e.target.value) })
									}
								/>
							</Field>
						)}

						{stage.stageType === "Drop" && (
							<Field label="Time Limit (seconds)">
								<input
									type="number"
									min={0}
									className={input}
									placeholder="0 = no limit"
									value={stage.timeLimit}
									onChange={(e) =>
										onPatch({ timeLimit: Number(e.target.value) })
									}
								/>
							</Field>
						)}

						{/* Dialogue nested collapsible — uses same CardCollapsible style */}
						<div
							className="-mx-4 overflow-hidden rounded-lg"
							style={{
								background: "var(--surface-3)",
								border: "1px solid var(--border)",
							}}
						>
							<CardCollapsible
								label="Dialogue Lines"
								count={stage.dialogues.length}
								defaultOpen={false}
							>
								<div className="flex flex-col gap-2">
									{stage.dialogues.map((line, li) => (
										<div
											key={line.id}
											className="flex flex-col gap-2 rounded-lg p-3"
											style={{
												background: "var(--surface-2)",
												border: "1px solid var(--border)",
											}}
										>
											<div className="flex items-center gap-2">
												<select
													className={`${select} flex-1`}
													value={line.speakerId}
													onChange={(e) =>
														onPatchDialogue(li, { speakerId: e.target.value })
													}
												>
													<option value="">Select speaker</option>
													{characters.map((c) => (
														<option key={c.id} value={c.id}>
															{c.name}
														</option>
													))}
												</select>
												<button
													type="button"
													onClick={() => setConfirmRemoveLine(li)}
													className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
													style={{ color: "#334155" }}
												>
													<Trash2 className="h-3 w-3" />
												</button>
											</div>
											<textarea
												className={`${input} resize-none`}
												rows={2}
												placeholder="Dialogue text…"
												value={line.text}
												onChange={(e) =>
													onPatchDialogue(li, { text: e.target.value })
												}
											/>
										</div>
									))}
									<button
										type="button"
										onClick={onAddDialogue}
										className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs transition-colors hover:bg-white/5"
										style={{
											color: stageColor,
											border: `1px dashed ${stageColor}30`,
										}}
									>
										<Plus className="h-3 w-3" />
										Add Line
									</button>
								</div>
							</CardCollapsible>
						</div>
					</div>
				</CardCollapsible>
			</div>

			{confirmRemove && (
				<ConfirmDialog
					message={`Remove Stage ${index + 1} (${stage.stageType}) and all its dialogue lines?`}
					onConfirm={() => {
						onRemove();
						setConfirmRemove(false);
					}}
					onCancel={() => setConfirmRemove(false)}
				/>
			)}
			{confirmRemoveLine !== null && (
				<ConfirmDialog
					message="Remove this dialogue line?"
					onConfirm={() => {
						onRemoveDialogue(confirmRemoveLine);
						setConfirmRemoveLine(null);
					}}
					onCancel={() => setConfirmRemoveLine(null)}
				/>
			)}
		</>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<span
				className="text-[11px] font-medium uppercase tracking-wider"
				style={{ color: "#475569" }}
			>
				{label}
			</span>
			{children}
		</div>
	);
}

function Divider() {
	return (
		<div className="h-px w-full" style={{ background: "var(--border)" }} />
	);
}

const inputBase =
	"w-full rounded-lg px-3 py-2 text-sm text-white placeholder-[#334155] focus:outline-none transition-colors duration-150";
const input = `${inputBase} bg-[#0d1017] border border-[rgba(255,255,255,0.06)] focus:border-[rgba(255,255,255,0.15)]`;
const select = `${inputBase} bg-[#0d1017] border border-[rgba(255,255,255,0.06)] focus:border-[rgba(255,255,255,0.15)] cursor-pointer`;
