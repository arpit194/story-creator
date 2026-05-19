import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import {
	createCharacter,
	deleteCharacter,
	getCharacters,
	updateCharacter,
} from "#/server/characters";
import type { Character } from "#/types/mission";

interface Props {
	onClose: () => void;
}

const EMPTY = { name: "", age: 0, description: "" };

export function CharactersModal({ onClose }: Props) {
	const qc = useQueryClient();
	const [form, setForm] = useState(EMPTY);
	const [editing, setEditing] = useState<Character | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<Character | null>(null);

	const { data: characters = [] } = useQuery({
		queryKey: ["characters"],
		queryFn: () => getCharacters(),
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: ["characters"] });

	const createMut = useMutation({
		mutationFn: (data: typeof EMPTY) => createCharacter({ data }),
		onSuccess: () => {
			invalidate();
			setForm(EMPTY);
		},
	});
	const updateMut = useMutation({
		mutationFn: (data: typeof EMPTY & { id: string }) =>
			updateCharacter({ data }),
		onSuccess: () => {
			invalidate();
			setEditing(null);
			setForm(EMPTY);
		},
	});
	const deleteMut = useMutation({
		mutationFn: (id: string) => deleteCharacter({ data: { id } }),
		onSuccess: invalidate,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		editing
			? updateMut.mutate({ ...form, id: editing.id })
			: createMut.mutate(form);
	};

	const startEdit = (c: Character) => {
		setEditing(c);
		setForm({ name: c.name, age: c.age, description: c.description });
	};
	const cancelEdit = () => {
		setEditing(null);
		setForm(EMPTY);
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
								style={{ background: "#a78bfa", boxShadow: "0 0 10px #a78bfa" }}
							/>
							<h2
								className="font-mono-game text-sm font-semibold uppercase tracking-widest"
								style={{ color: "#94a3b8" }}
							>
								Characters
							</h2>
							<span
								className="font-mono-game rounded-md px-2 py-0.5 text-[10px] font-semibold"
								style={{
									background: "rgba(167,139,250,0.1)",
									color: "#a78bfa",
									border: "1px solid rgba(167,139,250,0.2)",
								}}
							>
								{characters.length}
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

					{/* Form */}
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4 px-8 pb-5"
					>
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
								{editing ? `Editing: ${editing.name}` : "New Character"}
							</p>
							<div className="flex gap-3">
								<div className="flex flex-1 flex-col gap-1.5">
									<span className={label}>Name</span>
									<input
										className={input}
										placeholder="e.g. Mayor Tom"
										value={form.name}
										onChange={(e) =>
											setForm((f) => ({ ...f, name: e.target.value }))
										}
										required
									/>
								</div>
								<div className="flex w-24 flex-col gap-1.5">
									<span className={label}>Age</span>
									<input
										type="number"
										min={0}
										className={input}
										placeholder="0"
										value={form.age}
										onChange={(e) =>
											setForm((f) => ({ ...f, age: Number(e.target.value) }))
										}
									/>
								</div>
							</div>
							<div className="mt-3 flex flex-col gap-1.5">
								<span className={label}>Description</span>
								<textarea
									className={`${input} resize-none`}
									rows={2}
									placeholder="Brief description of this character"
									value={form.description}
									onChange={(e) =>
										setForm((f) => ({ ...f, description: e.target.value }))
									}
								/>
							</div>
							<div className="mt-3 flex gap-2">
								<button
									type="submit"
									disabled={createMut.isPending || updateMut.isPending}
									className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40"
									style={{
										background: "rgba(167,139,250,0.15)",
										color: "#a78bfa",
										border: "1px solid rgba(167,139,250,0.3)",
									}}
								>
									<Plus className="h-3.5 w-3.5" />
									{editing ? "Update" : "Add"} Character
								</button>
								{editing && (
									<button
										type="button"
										onClick={cancelEdit}
										className="rounded-lg px-4 py-2 text-xs transition-colors hover:bg-white/5"
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

					<div
						className="mx-8 h-px"
						style={{ background: "rgba(255,255,255,0.06)" }}
					/>

					{/* Card grid */}
					<div className="overflow-y-auto px-8 py-5">
						{characters.length === 0 && (
							<div className="flex flex-col items-center gap-3 py-12">
								<User className="h-8 w-8" style={{ color: "#1e293b" }} />
								<p className="text-sm" style={{ color: "#334155" }}>
									No characters yet — add one above
								</p>
							</div>
						)}
						<div className="grid grid-cols-2 gap-3">
							{characters.map((c) => (
								<div
									key={c.id}
									className="group flex flex-col gap-2 rounded-xl p-4 transition-colors"
									style={{
										background:
											editing?.id === c.id
												? "rgba(167,139,250,0.06)"
												: "rgba(255,255,255,0.02)",
										border: `1px solid ${editing?.id === c.id ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.05)"}`,
									}}
								>
									{/* Card top row */}
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="font-mono-game truncate text-sm font-semibold text-white">
												{c.name}
											</p>
											<span
												className="font-mono-game mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px]"
												style={{
													background: "rgba(255,255,255,0.05)",
													color: "#64748b",
												}}
											>
												age {c.age}
											</span>
										</div>
										<div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<button
												type="button"
												onClick={() => startEdit(c)}
												className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
												style={{ color: "#475569" }}
											>
												<Pencil className="h-3 w-3" />
											</button>
											<button
												type="button"
												onClick={() => setConfirmDelete(c)}
												className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
												style={{ color: "#475569" }}
											>
												<Trash2 className="h-3 w-3" />
											</button>
										</div>
									</div>
									{/* Description */}
									{c.description ? (
										<p
											className="line-clamp-2 text-xs leading-relaxed"
											style={{ color: "#475569" }}
										>
											{c.description}
										</p>
									) : (
										<p className="text-xs italic" style={{ color: "#1e293b" }}>
											No description
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{confirmDelete && (
				<ConfirmDialog
					message={`"${confirmDelete.name}" will be permanently removed.`}
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

const label = "text-[11px] font-medium uppercase tracking-wider text-[#475569]";
const input =
	"w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#080a0e] px-3 py-2 text-sm text-white placeholder-[#2d3748] focus:border-[rgba(255,255,255,0.15)] focus:outline-none transition-colors";
