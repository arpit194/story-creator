import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	File,
	FilePlus,
	Folder,
	Loader2,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { StoryEditor } from "#/components/StoryEditor";
import {
	createStoryFile,
	deleteStoryFile,
	getStoryFile,
	listStoryFiles,
	renameStoryFile,
	saveStoryFile,
} from "#/server/storyFiles";

export const Route = createFileRoute("/writer")({ component: Writer });

// ── Types ────────────────────────────────────────────────────────
interface FileEntry {
	id: string;
	path: string;
	updatedAt: Date;
}

interface Tab {
	id: string;
	path: string;
	content: string;
	dirty: boolean;
}

interface TreeNode {
	kind: "file";
	file: FileEntry;
}
interface TreeFolder {
	kind: "folder";
	name: string;
	fullPath: string; // e.g. "story/characters"
	children: TreeItem[];
}
type TreeItem = TreeNode | TreeFolder;

// ── Tree builder ─────────────────────────────────────────────────
function buildTree(files: FileEntry[]): TreeItem[] {
	// Map from folder fullPath → children array
	const folderMap = new Map<string, TreeItem[]>();
	const root: TreeItem[] = [];

	// Ensure parent folder nodes exist all the way up
	function ensureFolder(parts: string[]): TreeItem[] {
		if (parts.length === 0) return root;
		const fullPath = parts.join("/");
		if (!folderMap.has(fullPath)) {
			const parent = ensureFolder(parts.slice(0, -1));
			const node: TreeFolder = {
				kind: "folder",
				name: parts[parts.length - 1],
				fullPath,
				children: [],
			};
			folderMap.set(fullPath, node.children);
			// Insert folder before files in parent
			const insertAt = parent.findIndex((c) => c.kind === "file");
			if (insertAt === -1) parent.push(node);
			else parent.splice(insertAt, 0, node);
		}
		return folderMap.get(fullPath) ?? root;
	}

	const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
	for (const file of sorted) {
		const parts = file.path.split("/");
		const folderParts = parts.slice(0, -1);
		const parent = ensureFolder(folderParts);
		// Insert file after existing folders, before other files
		const insertAt = parent.findIndex((c) => c.kind === "file");
		if (insertAt === -1) parent.push({ kind: "file", file });
		else parent.splice(insertAt, 0, { kind: "file", file });
	}

	// Sort each level: folders first, then files, both alpha
	function sortLevel(items: TreeItem[]): TreeItem[] {
		const folders = items
			.filter((i): i is TreeFolder => i.kind === "folder")
			.sort((a, b) => a.name.localeCompare(b.name));
		const fileNodes = items
			.filter((i): i is TreeNode => i.kind === "file")
			.sort((a, b) => a.file.path.localeCompare(b.file.path));
		for (const f of folders) f.children = sortLevel(f.children);
		return [...folders, ...fileNodes];
	}

	return sortLevel(root);
}

function lastName(path: string) {
	const parts = path.split("/");
	return parts[parts.length - 1];
}

// ── Inline rename input ──────────────────────────────────────────
function InlineInput({
	initial,
	onConfirm,
	onCancel,
}: {
	initial: string;
	onConfirm: (v: string) => void;
	onCancel: () => void;
}) {
	const [val, setVal] = useState(initial);
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		ref.current?.select();
	}, []);
	return (
		<input
			ref={ref}
			className="w-full rounded bg-[#080a0e] px-1.5 py-0.5 text-xs text-white outline-none border border-[rgba(59,130,246,0.4)] focus:border-[rgba(59,130,246,0.7)]"
			value={val}
			onChange={(e) => setVal(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					if (val.trim()) onConfirm(val.trim());
				}
				if (e.key === "Escape") onCancel();
			}}
			onBlur={() => {
				if (val.trim()) onConfirm(val.trim());
				else onCancel();
			}}
			onClick={(e) => e.stopPropagation()}
		/>
	);
}

// ── Main component ───────────────────────────────────────────────
function Writer() {
	const qc = useQueryClient();

	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string | null>(null);

	// Explorer state
	const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
	// null = none, "root" = root, or a folder fullPath
	const [creatingIn, setCreatingIn] = useState<string | null>(null);
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
	const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
	// Track which file is being opened (loading its content)
	const [openingId, setOpeningId] = useState<string | null>(null);

	const { data: rawFiles = [], isLoading: filesLoading } = useQuery({
		queryKey: ["story-files"],
		queryFn: () => listStoryFiles(),
	});
	const files = rawFiles as FileEntry[];
	const tree = buildTree(files);

	const invalidate = () => qc.invalidateQueries({ queryKey: ["story-files"] });

	const createMut = useMutation({
		mutationFn: (path: string) => createStoryFile({ data: { path } }),
		onSuccess: async (file) => {
			invalidate();
			openTab({
				id: file.id,
				path: file.path,
				content: "",
				updatedAt: new Date(),
			});
			setCreatingIn(null);
		},
	});

	const renameMut = useMutation({
		mutationFn: ({ id, path }: { id: string; path: string }) =>
			renameStoryFile({ data: { id, path } }),
		onSuccess: (updated) => {
			invalidate();
			setRenamingId(null);
			if (updated) {
				setTabs((ts) =>
					ts.map((t) =>
						t.id === updated.id ? { ...t, path: updated.path } : t,
					),
				);
			}
		},
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => deleteStoryFile({ data: { id } }),
		onSuccess: (_, id) => {
			invalidate();
			setConfirmDeleteId(null);
			forceCloseTab(id);
		},
	});

	const saveMut = useMutation({
		mutationFn: ({ id, content }: { id: string; content: string }) =>
			saveStoryFile({ data: { id, content } }),
	});

	function handleSave(id: string, content: string) {
		saveMut.mutate({ id, content });
		setTabs((ts) =>
			ts.map((t) => (t.id === id ? { ...t, content, dirty: false } : t)),
		);
	}

	function handleDirty(id: string, dirty: boolean) {
		setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, dirty } : t)));
	}

	function openTab(
		file: Pick<FileEntry, "id" | "path"> & {
			content?: string;
			updatedAt?: Date;
		},
	) {
		if (tabs.find((t) => t.id === file.id)) {
			setActiveTabId(file.id);
			return;
		}
		if (file.content !== undefined) {
			setTabs((ts) => [
				...ts,
				{
					id: file.id,
					path: file.path,
					content: file.content ?? "",
					dirty: false,
				},
			]);
			setActiveTabId(file.id);
			return;
		}
		setOpeningId(file.id);
		getStoryFile({ data: { id: file.id } }).then((full) => {
			setOpeningId(null);
			if (!full) return;
			setTabs((ts) => [
				...ts,
				{ id: full.id, path: full.path, content: full.content, dirty: false },
			]);
			setActiveTabId(full.id);
		});
	}

	function forceCloseTab(id: string) {
		setConfirmCloseId(null);
		setTabs((ts) => {
			const next = ts.filter((t) => t.id !== id);
			if (activeTabId === id) {
				setActiveTabId(next[next.length - 1]?.id ?? null);
			}
			return next;
		});
	}

	function closeTab(id: string) {
		const tab = tabs.find((t) => t.id === id);
		if (tab?.dirty) {
			setConfirmCloseId(id);
		} else {
			forceCloseTab(id);
		}
	}

	function saveAll() {
		for (const tab of tabs) {
			if (tab.dirty) {
				saveMut.mutate({ id: tab.id, content: tab.content });
				setTabs((ts) =>
					ts.map((t) => (t.id === tab.id ? { ...t, dirty: false } : t)),
				);
			}
		}
	}

	function handleCreateFile(folderPath: string | null, name: string) {
		const path = folderPath ? `${folderPath}/${name}` : name;
		createMut.mutate(path);
	}

	function handleRename(file: FileEntry, newPath: string) {
		renameMut.mutate({ id: file.id, path: newPath.trim() });
	}

	const toggleFolder = (fullPath: string) =>
		setOpenFolders((s) => {
			const next = new Set(s);
			next.has(fullPath) ? next.delete(fullPath) : next.add(fullPath);
			return next;
		});

	const confirmDeleteFile = files.find((f) => f.id === confirmDeleteId);
	const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
	const isSaving = saveMut.isPending;

	return (
		<div
			className="flex h-screen flex-col"
			style={{ background: "var(--surface-0)" }}
		>
			{/* ── Nav ── */}
			<nav
				className="flex h-12 shrink-0 items-center justify-between px-6"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.05)",
					background: "rgba(8,10,14,0.95)",
				}}
			>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div
							className="flex h-5 w-5 items-center justify-center rounded"
							style={{
								background: "rgba(245,158,11,0.15)",
								border: "1px solid rgba(245,158,11,0.2)",
							}}
						>
							<span
								className="font-mono-game text-[8px] font-bold"
								style={{ color: "#f59e0b" }}
							>
								CT
							</span>
						</div>
						<span
							className="font-mono-game text-xs font-semibold uppercase tracking-widest"
							style={{ color: "#475569" }}
						>
							Story Writer
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
						to="/story"
						className="font-mono-game flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider transition-colors"
						style={{ color: "#334155" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "#94a3b8";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "#334155";
						}}
					>
						<span>Story Creator</span>
						<span>→</span>
					</Link>
				</div>
				<div className="flex items-center gap-2">
					{isSaving && (
						<span
							className="flex items-center gap-1.5 text-[11px]"
							style={{ color: "#475569" }}
						>
							<Loader2 className="h-3 w-3 animate-spin" />
							Saving…
						</span>
					)}
					{tabs.some((t) => t.dirty) && (
						<button
							type="button"
							onClick={saveAll}
							disabled={isSaving}
							className="font-mono-game flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
							style={{
								background: "rgba(59,130,246,0.12)",
								color: "#60a5fa",
								border: "1px solid rgba(59,130,246,0.25)",
							}}
						>
							Save All
						</button>
					)}
				</div>
			</nav>

			{/* ── Body ── */}
			<div className="flex flex-1 overflow-hidden">
				{/* ── Explorer panel ── */}
				<div
					className="flex w-60 shrink-0 flex-col"
					style={{
						borderRight: "1px solid rgba(255,255,255,0.05)",
						background: "#0a0c10",
					}}
				>
					{/* Explorer header */}
					<div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
						<div className="flex h-9 items-center justify-between px-3">
							<span
								className="text-[10px] font-semibold uppercase tracking-widest"
								style={{ color: "#334155" }}
							>
								Explorer
							</span>
							<div className="flex items-center gap-0.5">
								{(createMut.isPending ||
									renameMut.isPending ||
									deleteMut.isPending) && (
									<Loader2
										className="h-3 w-3 animate-spin"
										style={{ color: "#475569" }}
									/>
								)}
								<button
									type="button"
									title="New file"
									onClick={() => setCreatingIn("root")}
									disabled={createMut.isPending}
									className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/5 disabled:opacity-40"
									style={{ color: "#475569" }}
								>
									<FilePlus className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
						<div className="px-3 py-1.5">
							<p
								className="text-[10px] leading-relaxed"
								style={{ color: "#1e293b" }}
							>
								Name files as <span style={{ color: "#334155" }}>filename</span>{" "}
								or <span style={{ color: "#334155" }}>folder/sub/filename</span>{" "}
								— slashes create nested folders automatically.
							</p>
						</div>
					</div>

					{/* File tree */}
					<div className="flex-1 overflow-y-auto py-1">
						{filesLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2
									className="h-4 w-4 animate-spin"
									style={{ color: "#334155" }}
								/>
							</div>
						) : (
							<>
								{/* Root-level new file input */}
								{creatingIn === "root" && (
									<div className="flex items-center gap-1.5 px-2 py-1">
										<File
											className="h-3.5 w-3.5 shrink-0"
											style={{ color: "#64748b" }}
										/>
										<InlineInput
											initial=""
											onConfirm={(name) => handleCreateFile(null, name)}
											onCancel={() => setCreatingIn(null)}
										/>
									</div>
								)}

								<TreeLevel
									items={tree}
									depth={0}
									openFolders={openFolders}
									creatingIn={creatingIn}
									renamingId={renamingId}
									activeTabId={activeTabId}
									openingId={openingId}
									renamingPending={renameMut.isPending}
									deletingId={deleteMut.isPending ? confirmDeleteId : null}
									onToggleFolder={toggleFolder}
									onNewFile={(folderPath) => {
										setOpenFolders((s) => new Set([...s, folderPath]));
										setCreatingIn(folderPath);
									}}
									onCreateFile={handleCreateFile}
									onCancelCreate={() => setCreatingIn(null)}
									onOpenFile={openTab}
									onStartRename={(id) => setRenamingId(id)}
									onRename={handleRename}
									onCancelRename={() => setRenamingId(null)}
									onDeleteFile={(id) => setConfirmDeleteId(id)}
								/>
							</>
						)}
					</div>
				</div>

				{/* ── Editor area ── */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{/* Tab bar */}
					{tabs.length > 0 && (
						<div
							className="flex shrink-0 items-end overflow-x-auto"
							style={{
								borderBottom: "1px solid rgba(255,255,255,0.05)",
								background: "#080a0e",
							}}
						>
							{tabs.map((tab) => {
								const name = lastName(tab.path);
								const isActive = tab.id === activeTabId;
								return (
									<button
										key={tab.id}
										type="button"
										onClick={() => setActiveTabId(tab.id)}
										className="group relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-xs transition-colors"
										style={{
											background: isActive ? "var(--surface-0)" : "transparent",
											color: isActive ? "#e2e8f0" : "#475569",
											borderRight: "1px solid rgba(255,255,255,0.05)",
											borderTop: isActive
												? "1px solid rgba(59,130,246,0.5)"
												: "1px solid transparent",
										}}
									>
										<File
											className="h-3 w-3 shrink-0"
											style={{ color: isActive ? "#60a5fa" : "#334155" }}
										/>
										<span className="font-mono-game max-w-32 truncate">
											{name}
										</span>
										{tab.dirty && (
											<span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
										)}
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												closeTab(tab.id);
											}}
											className="flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
											style={{ color: "#475569" }}
										>
											<X className="h-2.5 w-2.5" />
										</button>
									</button>
								);
							})}
						</div>
					)}

					{/* Editor / placeholder */}
					{openingId ? (
						<div
							className="flex flex-1 items-center justify-center gap-2"
							style={{ color: "#334155" }}
						>
							<Loader2 className="h-4 w-4 animate-spin" />
							<span className="text-sm">Opening…</span>
						</div>
					) : activeTab ? (
						<StoryEditor
							key={activeTab.id}
							fileId={activeTab.id}
							initialContent={activeTab.content}
							onSave={(content) => handleSave(activeTab.id, content)}
							onDirty={(dirty) => handleDirty(activeTab.id, dirty)}
						/>
					) : (
						<div className="flex flex-1 flex-col items-center justify-center gap-3">
							<div
								className="flex h-12 w-12 items-center justify-center rounded-xl"
								style={{
									background: "rgba(245,158,11,0.08)",
									border: "1px solid rgba(245,158,11,0.12)",
								}}
							>
								<File className="h-5 w-5" style={{ color: "#78350f" }} />
							</div>
							<p className="text-sm" style={{ color: "#1e293b" }}>
								Open a file to start writing
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Confirm delete */}
			{confirmDeleteFile && (
				<ConfirmDialog
					message={`Delete "${lastName(confirmDeleteFile.path)}"? This cannot be undone.`}
					onConfirm={() => deleteMut.mutate(confirmDeleteFile.id)}
					onCancel={() => setConfirmDeleteId(null)}
				/>
			)}

			{confirmCloseId && (
				<ConfirmDialog
					message={`"${lastName(tabs.find((t) => t.id === confirmCloseId)?.path ?? "")}" has unsaved changes. Close anyway?`}
					confirmLabel="Close without saving"
					onConfirm={() => forceCloseTab(confirmCloseId)}
					onCancel={() => setConfirmCloseId(null)}
				/>
			)}
		</div>
	);
}

// ── Recursive tree renderer ──────────────────────────────────────
interface TreeLevelProps {
	items: TreeItem[];
	depth: number;
	openFolders: Set<string>;
	creatingIn: string | null;
	renamingId: string | null;
	activeTabId: string | null;
	openingId: string | null;
	renamingPending: boolean;
	deletingId: string | null;
	onToggleFolder: (fullPath: string) => void;
	onNewFile: (folderPath: string) => void;
	onCreateFile: (folderPath: string | null, name: string) => void;
	onCancelCreate: () => void;
	onOpenFile: (file: FileEntry) => void;
	onStartRename: (id: string) => void;
	onRename: (file: FileEntry, newPath: string) => void;
	onCancelRename: () => void;
	onDeleteFile: (id: string) => void;
}

function TreeLevel({
	items,
	depth,
	openFolders,
	creatingIn,
	renamingId,
	activeTabId,
	openingId,
	renamingPending,
	deletingId,
	onToggleFolder,
	onNewFile,
	onCreateFile,
	onCancelCreate,
	onOpenFile,
	onStartRename,
	onRename,
	onCancelRename,
	onDeleteFile,
}: TreeLevelProps) {
	const indent = depth * 12 + 8;

	return (
		<>
			{items.map((item) => {
				if (item.kind === "folder") {
					const isOpen = openFolders.has(item.fullPath);
					return (
						<div key={item.fullPath}>
							<FolderRow
								name={item.name}
								indent={indent}
								isOpen={isOpen}
								onToggle={() => onToggleFolder(item.fullPath)}
								onNewFile={() => onNewFile(item.fullPath)}
							/>
							{isOpen && (
								<>
									{creatingIn === item.fullPath && (
										<div
											className="flex items-center gap-1.5 py-1 pr-2"
											style={{ paddingLeft: indent + 20 }}
										>
											<File
												className="h-3.5 w-3.5 shrink-0"
												style={{ color: "#64748b" }}
											/>
											<InlineInput
												initial=""
												onConfirm={(name) => onCreateFile(item.fullPath, name)}
												onCancel={onCancelCreate}
											/>
										</div>
									)}
									<TreeLevel
										items={item.children}
										depth={depth + 1}
										openFolders={openFolders}
										creatingIn={creatingIn}
										renamingId={renamingId}
										activeTabId={activeTabId}
										openingId={openingId}
										renamingPending={renamingPending}
										deletingId={deletingId}
										onToggleFolder={onToggleFolder}
										onNewFile={onNewFile}
										onCreateFile={onCreateFile}
										onCancelCreate={onCancelCreate}
										onOpenFile={onOpenFile}
										onStartRename={onStartRename}
										onRename={onRename}
										onCancelRename={onCancelRename}
										onDeleteFile={onDeleteFile}
									/>
								</>
							)}
						</div>
					);
				}

				// file node
				const { file } = item;
				const isActive = activeTabId === file.id;
				const isRenaming = renamingId === file.id;
				const isOpening = openingId === file.id;
				const isDeleting = deletingId === file.id;

				return (
					<button
						key={file.id}
						type="button"
						className="group relative flex w-full items-center gap-1.5 py-1 pr-2 cursor-pointer transition-colors hover:bg-white/3 text-left"
						style={{
							paddingLeft: indent + 4,
							background: isActive ? "rgba(59,130,246,0.08)" : undefined,
							borderLeft: isActive
								? "2px solid rgba(59,130,246,0.5)"
								: "2px solid transparent",
							opacity: isDeleting ? 0.4 : 1,
						}}
						onClick={() => !isRenaming && onOpenFile(file)}
					>
						{isOpening || isDeleting ? (
							<Loader2
								className="h-3.5 w-3.5 shrink-0 animate-spin"
								style={{ color: "#475569" }}
							/>
						) : (
							<File
								className="h-3.5 w-3.5 shrink-0"
								style={{ color: isActive ? "#60a5fa" : "#334155" }}
							/>
						)}
						{isRenaming ? (
							<InlineInput
								initial={file.path}
								onConfirm={(newPath) => onRename(file, newPath)}
								onCancel={onCancelRename}
							/>
						) : (
							<span
								className="font-mono-game min-w-0 flex-1 truncate text-[12px]"
								style={{ color: isActive ? "#e2e8f0" : "#64748b" }}
							>
								{lastName(file.path)}
							</span>
						)}
						{!isRenaming && !isOpening && !isDeleting && (
							<div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onStartRename(file.id);
									}}
									disabled={renamingPending}
									className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/10 disabled:opacity-40"
									style={{ color: "#475569" }}
								>
									<Pencil className="h-2.5 w-2.5" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onDeleteFile(file.id);
									}}
									className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-red-500/10"
									style={{ color: "#475569" }}
								>
									<Trash2 className="h-2.5 w-2.5" />
								</button>
							</div>
						)}
					</button>
				);
			})}
		</>
	);
}

// ── FolderRow ────────────────────────────────────────────────────
function FolderRow({
	name,
	indent,
	isOpen,
	onToggle,
	onNewFile,
}: {
	name: string;
	indent: number;
	isOpen: boolean;
	onToggle: () => void;
	onNewFile: () => void;
}) {
	return (
		<button
			type="button"
			className="group flex w-full items-center gap-1.5 py-1 pr-2 cursor-pointer transition-colors hover:bg-white/3 text-left"
			style={{ paddingLeft: indent }}
			onClick={onToggle}
		>
			{isOpen ? (
				<ChevronDown
					className="h-3 w-3 shrink-0"
					style={{ color: "#334155" }}
				/>
			) : (
				<ChevronRight
					className="h-3 w-3 shrink-0"
					style={{ color: "#334155" }}
				/>
			)}
			<Folder className="h-3.5 w-3.5 shrink-0" style={{ color: "#f59e0b" }} />
			<span
				className="font-mono-game min-w-0 flex-1 truncate text-[12px]"
				style={{ color: "#94a3b8" }}
			>
				{name}
			</span>
			<button
				type="button"
				title="New file in folder"
				onClick={(e) => {
					e.stopPropagation();
					onNewFile();
				}}
				className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
				style={{ color: "#475569" }}
			>
				<FilePlus className="h-2.5 w-2.5" />
			</button>
		</button>
	);
}
