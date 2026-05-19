import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	List,
	ListOrdered,
	Minus,
	Quote,
	RotateCcw,
	RotateCw,
	Strikethrough,
} from "lucide-react";
import { useCallback, useEffect } from "react";

interface Props {
	fileId: string;
	initialContent: string;
	onSave: (content: string) => void;
	onDirty: (dirty: boolean) => void;
}

export function StoryEditor({
	fileId,
	initialContent,
	onSave,
	onDirty,
}: Props) {
	const editor = useEditor({
		extensions: [StarterKit],
		content: initialContent || "<p></p>",
		editorProps: {
			attributes: {
				class: "story-editor-content",
				spellcheck: "true",
			},
		},
		onUpdate: () => {
			onDirty(true);
		},
	});

	// Load content when the editor first mounts for this file — fileId is the key
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only on fileId change
	useEffect(() => {
		if (!editor) return;
		editor.commands.setContent(initialContent || "<p></p>", false);
		// Do NOT call onDirty here — dirty state is owned by the parent tab array
	}, [fileId]);

	const handleSave = useCallback(() => {
		if (!editor) return;
		onSave(editor.getHTML());
	}, [editor, onSave]);

	// Cmd/Ctrl+S to save
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleSave]);

	if (!editor) return null;

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Toolbar */}
			<div
				className="flex shrink-0 items-center gap-0.5 px-3 py-1.5"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.05)",
					background: "#080a0e",
				}}
			>
				<ToolGroup>
					<ToolBtn
						icon={Heading1}
						active={editor.isActive("heading", { level: 1 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						title="Heading 1"
					/>
					<ToolBtn
						icon={Heading2}
						active={editor.isActive("heading", { level: 2 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						title="Heading 2"
					/>
					<ToolBtn
						icon={Heading3}
						active={editor.isActive("heading", { level: 3 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
						title="Heading 3"
					/>
				</ToolGroup>

				<Divider />

				<ToolGroup>
					<ToolBtn
						icon={Bold}
						active={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
						title="Bold"
					/>
					<ToolBtn
						icon={Italic}
						active={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
						title="Italic"
					/>
					<ToolBtn
						icon={Strikethrough}
						active={editor.isActive("strike")}
						onClick={() => editor.chain().focus().toggleStrike().run()}
						title="Strikethrough"
					/>
					<ToolBtn
						icon={Code}
						active={editor.isActive("code")}
						onClick={() => editor.chain().focus().toggleCode().run()}
						title="Inline code"
					/>
				</ToolGroup>

				<Divider />

				<ToolGroup>
					<ToolBtn
						icon={List}
						active={editor.isActive("bulletList")}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						title="Bullet list"
					/>
					<ToolBtn
						icon={ListOrdered}
						active={editor.isActive("orderedList")}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						title="Numbered list"
					/>
					<ToolBtn
						icon={Quote}
						active={editor.isActive("blockquote")}
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						title="Blockquote"
					/>
					<ToolBtn
						icon={Minus}
						active={false}
						onClick={() => editor.chain().focus().setHorizontalRule().run()}
						title="Divider"
					/>
				</ToolGroup>

				<Divider />

				<ToolGroup>
					<ToolBtn
						icon={RotateCcw}
						active={false}
						onClick={() => editor.chain().focus().undo().run()}
						title="Undo"
						disabled={!editor.can().undo()}
					/>
					<ToolBtn
						icon={RotateCw}
						active={false}
						onClick={() => editor.chain().focus().redo().run()}
						title="Redo"
						disabled={!editor.can().redo()}
					/>
				</ToolGroup>

				<div className="flex-1" />

				<button
					type="button"
					onClick={handleSave}
					className="rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors"
					style={{
						background: "rgba(59,130,246,0.12)",
						color: "#60a5fa",
						border: "1px solid rgba(59,130,246,0.25)",
					}}
				>
					Save
				</button>
			</div>

			{/* Editor */}
			<div className="flex-1 overflow-y-auto" style={{ background: "#0d1017" }}>
				<div
					className="mx-auto my-10"
					style={{
						maxWidth: 760,
						background: "#111520",
						border: "1px solid rgba(255,255,255,0.06)",
						borderRadius: 12,
						minHeight: "calc(100vh - 200px)",
					}}
				>
					<EditorContent editor={editor} />
				</div>
			</div>
		</div>
	);
}

function ToolGroup({ children }: { children: React.ReactNode }) {
	return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
	return (
		<div
			className="mx-1.5 h-4 w-px"
			style={{ background: "rgba(255,255,255,0.08)" }}
		/>
	);
}

function ToolBtn({
	icon: Icon,
	active,
	onClick,
	title,
	disabled = false,
}: {
	icon: React.ElementType;
	active: boolean;
	onClick: () => void;
	title: string;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			title={title}
			onClick={onClick}
			disabled={disabled}
			className="flex h-7 w-7 items-center justify-center rounded transition-colors disabled:opacity-30"
			style={{
				background: active ? "rgba(59,130,246,0.15)" : "transparent",
				color: active ? "#60a5fa" : "#475569",
			}}
			onMouseEnter={(e) => {
				if (!active && !disabled) e.currentTarget.style.color = "#94a3b8";
			}}
			onMouseLeave={(e) => {
				if (!active) e.currentTarget.style.color = "#475569";
			}}
		>
			<Icon className="h-3.5 w-3.5" />
		</button>
	);
}
