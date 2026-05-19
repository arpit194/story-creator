import { createFileRoute, Link } from "@tanstack/react-router";
import { GitBranch, PenLine } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const tiles = [
	{
		to: "/story",
		icon: GitBranch,
		title: "Story Creator",
		description: "Build and connect missions visually on a node graph canvas",
		accent: "#3b82f6",
		glow: "rgba(59,130,246,0.08)",
		tag: "GRAPH EDITOR",
	},
	{
		to: "/writer",
		icon: PenLine,
		title: "Story Writer",
		description: "Write and manage story documents, lore, and world notes",
		accent: "#f59e0b",
		glow: "rgba(245,158,11,0.08)",
		tag: "TEXT EDITOR",
	},
];

function Home() {
	return (
		<div
			className="relative flex min-h-screen flex-col overflow-hidden"
			style={{ background: "var(--surface-0)" }}
		>
			{/* Nav */}
			<nav
				className="relative z-20 flex h-12 shrink-0 items-center justify-between px-6"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.05)",
					background: "rgba(8,10,14,0.8)",
				}}
			>
				<div className="flex items-center gap-2">
					<div
						className="flex h-5 w-5 items-center justify-center rounded"
						style={{
							background: "rgba(59,130,246,0.15)",
							border: "1px solid rgba(59,130,246,0.2)",
						}}
					>
						<span className="font-mono-game text-[8px] font-bold text-blue-400">
							CT
						</span>
					</div>
					<span
						className="font-mono-game text-xs font-semibold uppercase tracking-widest"
						style={{ color: "#475569" }}
					>
						ChillTown
					</span>
				</div>
				<div className="flex items-center gap-1">
					{[
						{ to: "/story", label: "Story Creator" },
						{ to: "/writer", label: "Story Writer" },
					].map(({ to, label }) => (
						<Link
							key={to}
							to={to}
							className="font-mono-game rounded-lg px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors hover:bg-white/5 hover:text-white"
							style={{ color: "#475569" }}
						>
							{label}
						</Link>
					))}
				</div>
			</nav>

			<div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-8">
				{/* Background grid */}
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
						backgroundSize: "48px 48px",
					}}
				/>
				{/* Radial vignette */}
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #080a0e 100%)",
					}}
				/>

				<div className="relative z-10 flex flex-col items-center gap-12">
					{/* Logo */}
					<div className="flex flex-col items-center gap-3">
						<div
							className="flex h-14 w-14 items-center justify-center rounded-2xl"
							style={{
								background:
									"linear-gradient(135deg, rgba(59,130,246,0.2), rgba(245,158,11,0.1))",
								border: "1px solid rgba(255,255,255,0.08)",
								boxShadow:
									"0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
							}}
						>
							<span className="font-mono-game text-lg font-semibold text-white">
								CT
							</span>
						</div>
						<div className="text-center">
							<h1
								className="text-3xl font-bold tracking-tight text-white"
								style={{ letterSpacing: "-0.02em" }}
							>
								ChillTown
							</h1>
							<p className="mt-1 text-sm" style={{ color: "#475569" }}>
								Narrative authoring toolkit
							</p>
						</div>
					</div>

					{/* Tiles */}
					<div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
						{tiles.map(
							({ to, icon: Icon, title, description, accent, glow, tag }) => (
								<Link
									key={to}
									to={to}
									className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-6 transition-all duration-300"
									style={{
										background: `linear-gradient(135deg, var(--surface-2), var(--surface-1))`,
										border: "1px solid var(--border)",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = `linear-gradient(135deg, ${glow}, var(--surface-2))`;
										e.currentTarget.style.border = `1px solid ${accent}40`;
										e.currentTarget.style.boxShadow = `0 0 40px ${glow}, 0 8px 32px rgba(0,0,0,0.3)`;
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = `linear-gradient(135deg, var(--surface-2), var(--surface-1))`;
										e.currentTarget.style.border = "1px solid var(--border)";
										e.currentTarget.style.boxShadow = "none";
									}}
								>
									<div className="flex items-start justify-between">
										<div
											className="flex h-10 w-10 items-center justify-center rounded-xl"
											style={{
												background: `${accent}18`,
												border: `1px solid ${accent}30`,
											}}
										>
											<Icon style={{ color: accent }} className="h-4.5 w-4.5" />
										</div>
										<span
											className="font-mono-game text-[10px] font-semibold tracking-widest"
											style={{ color: accent, opacity: 0.7 }}
										>
											{tag}
										</span>
									</div>
									<div>
										<p
											className="text-base font-semibold text-white"
											style={{ letterSpacing: "-0.01em" }}
										>
											{title}
										</p>
										<p
											className="mt-1 text-sm leading-relaxed"
											style={{ color: "#64748b" }}
										>
											{description}
										</p>
									</div>
									<div
										className="flex items-center gap-1.5 text-xs font-medium transition-all duration-200"
										style={{ color: accent, opacity: 0.6 }}
									>
										<span>Open</span>
										<span className="transition-transform duration-200 group-hover:translate-x-0.5">
											→
										</span>
									</div>
								</Link>
							),
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
