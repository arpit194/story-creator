import {
	Building2,
	Download,
	GitBranch,
	HelpCircle,
	MessageSquare,
	MousePointer2,
	Save,
	X,
} from "lucide-react";
import { useState } from "react";

interface Props {
	onClose: () => void;
}

interface Item {
	label: string;
	detail: string;
	kbd?: string[];
}

interface Section {
	id: string;
	title: string;
	icon: React.ElementType;
	color: string;
	items: Item[];
}

const sections: Section[] = [
	{
		id: "canvas",
		title: "Canvas basics",
		icon: MousePointer2,
		color: "#60a5fa",
		items: [
			{
				label: "Add a mission",
				detail:
					"Right-click anywhere on the empty canvas to open the context menu, then pick a type — Story, Side, or Base.",
			},
			{
				label: "Move a mission",
				detail:
					"Drag any node to a new position. The layout is saved automatically so it's preserved next time you open the app.",
			},
			{
				label: "Pan the canvas",
				detail:
					"Click and drag the background to move around. Scroll or pinch to zoom in and out.",
				kbd: ["Scroll"],
			},
			{
				label: "Select & delete",
				detail:
					"Click a node or edge to select it, then press Backspace or Delete. A confirmation dialog appears before anything is removed.",
				kbd: ["Del", "Backspace"],
			},
		],
	},
	{
		id: "edges",
		title: "Prerequisites & edges",
		icon: GitBranch,
		color: "#a78bfa",
		items: [
			{
				label: "Draw a connection",
				detail:
					"Hover over a node until the handles appear. Drag from the right handle of Mission A to the left handle of Mission B — this means A must finish before B unlocks.",
			},
			{
				label: "Multiple prerequisites",
				detail:
					"You can connect several missions into the same node's left handle. Every one of them must be completed before that mission becomes available.",
			},
			{
				label: "Independent side chains",
				detail:
					"A mission with no incoming edges is always available from the start. Side missions don't need to connect to the main story unless you want them to.",
			},
		],
	},
	{
		id: "editor",
		title: "Mission editor",
		icon: MessageSquare,
		color: "#34d399",
		items: [
			{
				label: "Open the panel",
				detail:
					"Click any mission node on the canvas to open its detail panel on the right side of the screen.",
			},
			{
				label: "Stages",
				detail:
					"Missions are made of ordered stages — Dialogue, Pickup, or Drop. Add as many as needed; the order matters for gameplay progression.",
			},
			{
				label: "Dialogue lines",
				detail:
					"Any stage type can have dialogue lines. Pick a speaker from the Characters list and type their line. Add multiple lines to create a conversation.",
			},
			{
				label: "Pickup & Drop stages",
				detail:
					"Set a target building (or leave it null for a random one) and fill in cargo weight (Pickup) or time limit (Drop). Both can include dialogue before or after the action.",
			},
		],
	},
	{
		id: "saving",
		title: "Saving & versions",
		icon: Save,
		color: "#f59e0b",
		items: [
			{
				label: "Auto-save",
				detail:
					"The canvas saves automatically a few seconds after you stop making changes. The status indicator in the top bar shows when it last saved.",
			},
			{
				label: "Save a named version",
				detail:
					"Click 'Save Version' to snapshot the current graph with an optional label. Good to do before a big restructure so you can roll back.",
			},
			{
				label: "Restore a version",
				detail:
					"Open 'Versions', find the snapshot you want, and click 'Set Current'. The canvas updates immediately.",
			},
		],
	},
	{
		id: "export",
		title: "Exporting & importing",
		icon: Download,
		color: "#fb7185",
		items: [
			{
				label: "Copy Story JSON",
				detail:
					"Copies the current canvas as a JSON array that matches the Unity MissionDefinition shape. Paste it directly into the Unity importer script.",
			},
			{
				label: "Copy LLM Template",
				detail:
					"Copies a pre-filled prompt with your characters and buildings already listed. Paste it into an AI, describe what you want, and it'll generate mission JSON you can import back.",
			},
			{
				label: "Import JSON",
				detail:
					"Paste a JSON array of missions to add them to the canvas. Existing missions stay untouched — new nodes appear to the right of the current graph.",
			},
		],
	},
	{
		id: "registries",
		title: "Characters & buildings",
		icon: Building2,
		color: "#94a3b8",
		items: [
			{
				label: "Characters",
				detail:
					"Open the Characters panel to add, edit, or remove characters. Each character has a name, age, and description. They appear in dialogue speaker dropdowns across all missions.",
			},
			{
				label: "Buildings",
				detail:
					"Open the Buildings panel to manage locations. Buildings appear in the target building dropdown inside Pickup and Drop stages.",
			},
		],
	},
];

export function HelpModal({ onClose }: Props) {
	const [active, setActive] = useState(sections[0].id);
	const section = sections.find((s) => s.id === active) ?? sections[0];
	const Icon = section.icon;

	return (
		<div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
			<button
				type="button"
				aria-label="Close help"
				className="absolute inset-0 h-full w-full cursor-default"
				onClick={onClose}
			/>
			<div
				className="relative flex w-full overflow-hidden rounded-2xl shadow-2xl"
				style={{
					background: "linear-gradient(160deg, #111520, #0d1017)",
					border: "1px solid rgba(255,255,255,0.08)",
					maxWidth: 900,
					height: "80vh",
				}}
			>
				{/* Sidebar */}
				<div
					className="flex w-52 shrink-0 flex-col py-4"
					style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
				>
					<div className="mb-4 px-5">
						<div className="flex items-center gap-2">
							<HelpCircle className="h-4 w-4" style={{ color: "#3b82f6" }} />
							<span className="text-sm font-semibold text-white">Help</span>
						</div>
						<p
							className="mt-1 text-[11px] leading-relaxed"
							style={{ color: "#334155" }}
						>
							Story Creator reference
						</p>
					</div>

					<nav className="flex flex-col gap-0.5 px-2">
						{sections.map((s) => {
							const SIcon = s.icon;
							const isActive = s.id === active;
							return (
								<button
									key={s.id}
									type="button"
									onClick={() => setActive(s.id)}
									className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all"
									style={{
										background: isActive
											? "rgba(255,255,255,0.06)"
											: "transparent",
										color: isActive ? "#e2e8f0" : "#475569",
									}}
									onMouseEnter={(e) => {
										if (!isActive) e.currentTarget.style.color = "#94a3b8";
									}}
									onMouseLeave={(e) => {
										if (!isActive) e.currentTarget.style.color = "#475569";
									}}
								>
									<SIcon
										className="h-3.5 w-3.5 shrink-0"
										style={{ color: isActive ? s.color : "currentColor" }}
									/>
									{s.title}
								</button>
							);
						})}
					</nav>
				</div>

				{/* Content */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{/* Header */}
					<div
						className="flex shrink-0 items-center justify-between px-8 py-5"
						style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
					>
						<div className="flex items-center gap-3">
							<div
								className="flex h-8 w-8 items-center justify-center rounded-lg"
								style={{
									background: `${section.color}15`,
									border: `1px solid ${section.color}25`,
								}}
							>
								<Icon className="h-4 w-4" style={{ color: section.color }} />
							</div>
							<h2 className="text-base font-semibold text-white">
								{section.title}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
							style={{ color: "#475569" }}
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* Items */}
					<div className="flex-1 overflow-y-auto px-8 py-6">
						<div className="flex flex-col gap-5">
							{section.items.map((item, i) => (
								<div key={item.label} className="flex gap-4">
									<div
										className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
										style={{
											background: `${section.color}12`,
											color: section.color,
											border: `1px solid ${section.color}20`,
										}}
									>
										{i + 1}
									</div>
									<div className="flex-1">
										<div className="mb-1.5 flex items-center gap-2">
											<p
												className="text-sm font-semibold"
												style={{ color: "#e2e8f0" }}
											>
												{item.label}
											</p>
											{item.kbd && (
												<div className="flex items-center gap-1">
													{item.kbd.map((k) => (
														<kbd
															key={k}
															className="rounded px-1.5 py-0.5 text-[10px] font-mono"
															style={{
																background: "rgba(255,255,255,0.06)",
																border: "1px solid rgba(255,255,255,0.1)",
																color: "#64748b",
															}}
														>
															{k}
														</kbd>
													))}
												</div>
											)}
										</div>
										<p
											className="text-sm leading-relaxed"
											style={{ color: "#64748b" }}
										>
											{item.detail}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Footer nav */}
					<div
						className="flex shrink-0 items-center justify-between px-8 py-3"
						style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
					>
						<button
							type="button"
							onClick={() => {
								const idx = sections.findIndex((s) => s.id === active);
								if (idx > 0) setActive(sections[idx - 1].id);
							}}
							disabled={sections[0].id === active}
							className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-0"
							style={{ color: "#334155" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = "#94a3b8";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "#334155";
							}}
						>
							← Previous
						</button>
						<div className="flex items-center gap-1.5">
							{sections.map((s) => (
								<button
									key={s.id}
									type="button"
									onClick={() => setActive(s.id)}
									className="h-1.5 rounded-full transition-all"
									style={{
										width: s.id === active ? 16 : 6,
										background:
											s.id === active ? section.color : "rgba(255,255,255,0.1)",
									}}
								/>
							))}
						</div>
						<button
							type="button"
							onClick={() => {
								const idx = sections.findIndex((s) => s.id === active);
								if (idx < sections.length - 1) setActive(sections[idx + 1].id);
							}}
							disabled={sections[sections.length - 1].id === active}
							className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-0"
							style={{ color: "#334155" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = "#94a3b8";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "#334155";
							}}
						>
							Next →
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
