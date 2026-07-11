"use client";

import {
  Activity,
  Archive,
  ArrowLeft,
  Bell,
  Blocks,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Command,
  File,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderClosed,
  FolderKanban,
  Grid2X2,
  HardDrive,
  Home,
  Inbox,
  LayoutTemplate,
  List,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Target,
  Upload,
  Users,
  X,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type FileKind = "word" | "excel" | "pdf" | "code" | "image";
type ProjectFile = {
  id: string;
  name: string;
  kind: FileKind;
  folder: string;
  path: string;
  revision: string;
  status: string;
  modified: string;
  size: string;
  snippet: string;
};

const folders = [
  { id: "root", name: "All project files", count: 47 },
  { id: "customer", name: "Customer Documents", count: 8 },
  { id: "requirements", name: "Requirements", count: 5 },
  { id: "design", name: "System Design", count: 9 },
  { id: "scripts", name: "Scripts & Tools", count: 7 },
  { id: "builds", name: "Build Records", count: 4 },
  { id: "validation", name: "Validation & Testing", count: 11 },
  { id: "sops", name: "SOPs & Work Instructions", count: 3 },
];

const initialFiles: ProjectFile[] = [
  { id: "f1", name: "PD-1042 Visual Inspection Setup.docx", kind: "word", folder: "sops", path: "SOPs & Work Instructions", revision: "Rev C", status: "Draft", modified: "12 min ago", size: "2.4 MB", snippet: "Fixture alignment, camera calibration, and production setup procedure." },
  { id: "f2", name: "System Architecture Rev C.pdf", kind: "pdf", folder: "design", path: "System Design / Released", revision: "Rev C", status: "Released", modified: "Yesterday", size: "8.7 MB", snippet: "Camera trigger signal enters digital input DI4 on the edge controller." },
  { id: "f3", name: "camera_trigger_recovery.py", kind: "code", folder: "scripts", path: "Scripts & Tools / Vision", revision: "v7", status: "In review", modified: "18 min ago", size: "18 KB", snippet: "Restarts the trigger service and verifies the camera heartbeat after resume." },
  { id: "f4", name: "EVT-03 Endurance Results.xlsx", kind: "excel", folder: "validation", path: "Validation & Testing / EVT-03", revision: "Rev A", status: "Draft", modified: "2 hours ago", size: "4.1 MB", snippet: "24-hour endurance cycle data, trigger recovery timing, and failure events." },
  { id: "f5", name: "FAI-026 Connector Inspection.pdf", kind: "pdf", folder: "validation", path: "Validation & Testing / First Articles", revision: "Rev B", status: "Released", modified: "Jul 9", size: "12.8 MB", snippet: "First article inspection criteria for connector position and labeling." },
  { id: "f6", name: "fixture-alignment-reference.heic", kind: "image", folder: "builds", path: "Build Records / EVT-03 / Photos", revision: "Original", status: "Indexed", modified: "Jul 8", size: "6.2 MB", snippet: "Reference image captured during EVT-03 fixture alignment." },
  { id: "f7", name: "Customer Acceptance Criteria.docx", kind: "word", folder: "customer", path: "Customer Documents / Specifications", revision: "Rev 4", status: "Customer", modified: "Jul 3", size: "1.8 MB", snippet: "Acceptance criteria for throughput, false-reject rate, and image retention." },
];

const workstreams = [
  { name: "Mechanical fixture", detail: "Released for EVT-03", value: 100, state: "Complete" },
  { name: "Electrical integration", detail: "I/O verification", value: 85, state: "On track" },
  { name: "Vision software", detail: "Trigger recovery under review", value: 65, state: "At risk" },
  { name: "Validation", detail: "VR-018 endurance run", value: 48, state: "In progress" },
];

const activities = [
  { icon: Code2, text: "camera_trigger_recovery.py revised", meta: "v6 → v7 · 18 min ago", tone: "blue" },
  { icon: CircleAlert, text: "VR-018 marked Failed", meta: "EVT-03 · 2 hours ago", tone: "amber" },
  { icon: ShieldCheck, text: "System Architecture released", meta: "Rev C · Yesterday", tone: "green" },
  { icon: Activity, text: "Project health changed", meta: "On track → At risk · Jul 9", tone: "amber" },
];

function KindIcon({ kind, size = 18 }: { kind: FileKind; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  if (kind === "word") return <FileText {...props} />;
  if (kind === "excel") return <FileSpreadsheet {...props} />;
  if (kind === "code") return <FileCode2 {...props} />;
  if (kind === "image") return <FileImage {...props} />;
  return <File {...props} />;
}

export function NibbleApp() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("root");
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [files, setFiles] = useState(initialFiles);
  const [dragging, setDragging] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files.slice(0, 5);
    return files.filter((file) =>
      [file.name, file.path, file.revision, file.status, file.snippet]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [files, query]);

  const visibleFiles = selectedFolder === "root" ? files : files.filter((file) => file.folder === selectedFolder);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
        setSelectedFile(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => searchInput.current?.focus(), 30);
  }, [searchOpen]);

  function revealFile(file: ProjectFile) {
    setSearchOpen(false);
    setActiveTab("Files");
    setSelectedFolder(file.folder);
    setHighlighted(file.id);
    setSelectedFile(file);
    window.setTimeout(() => setHighlighted(null), 2200);
  }

  function moveFile(event: DragEvent, folderId: string) {
    event.preventDefault();
    if (!dragging || folderId === "root") return;
    const folder = folders.find((item) => item.id === folderId);
    setFiles((current) => current.map((file) => file.id === dragging ? { ...file, folder: folderId, path: folder?.name ?? file.path } : file));
    setDragging(null);
    setUploadMessage(`Moved to ${folder?.name}`);
    window.setTimeout(() => setUploadMessage(""), 2400);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const list = Array.from(event.target.files ?? []);
    const tooLarge = list.find((item) => item.size > 100 * 1024 * 1024);
    if (tooLarge) {
      setUploadMessage(`${tooLarge.name} is larger than the 100 MB limit.`);
      return;
    }
    if (list.length) setUploadMessage(`${list.length} file${list.length > 1 ? "s" : ""} ready to upload when storage is connected.`);
    event.target.value = "";
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand"><div className="brand-mark">N</div><span>Nibble</span><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <nav className="main-nav" aria-label="Primary navigation">
          <button className="nav-item active"><Home size={18} />Home</button>
          <button className="nav-item"><Users size={18} />Customers<span className="nav-count">4</span></button>
          <button className="nav-item"><Inbox size={18} />Inbox<span className="nav-count accent">6</span></button>
          <button className="nav-item"><LayoutTemplate size={18} />Templates</button>
          <button className="nav-item"><Archive size={18} />Archive</button>
        </nav>
        <div className="sidebar-section">
          <div className="section-label"><span>Active projects</span><Plus size={14} /></div>
          <button className="project-link active"><span className="project-dot cyan" /><span><strong>Edge AI Inspection</strong><small>AXT-NPI-026</small></span></button>
          <button className="project-link"><span className="project-dot violet" /><span><strong>Transit Controller</strong><small>AXT-NPI-021</small></span></button>
          <button className="project-link"><span className="project-dot orange" /><span><strong>Burn-in Automation</strong><small>INT-OPS-014</small></span></button>
        </div>
        <div className="sidebar-footer">
          <button className="nav-item"><Settings size={18} />Settings</button>
          <div className="profile"><div className="avatar">AT</div><span><strong>Armando</strong><small>Private workspace</small></span><MoreHorizontal size={17} /></div>
        </div>
      </aside>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-shell">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="top-breadcrumb"><span>Axiomtek Systems</span><ChevronRight size={14} /><strong>Edge AI Inspection</strong></div>
          <button className="search-trigger" onClick={() => setSearchOpen(true)}><Search size={17} /><span>Search projects, files, contents…</span><kbd><Command size={12} />K</kbd></button>
          <div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button><button className="primary-button" onClick={() => uploadInput.current?.click()}><Plus size={17} />Add</button></div>
          <input ref={uploadInput} type="file" multiple hidden onChange={handleUpload} />
        </header>

        {uploadMessage && <div className="toast"><CheckCircle2 size={17} />{uploadMessage}</div>}

        <section className="workspace">
          <div className="project-heading">
            <div className="eyebrow"><span>Axiomtek Systems</span><ChevronRight size={13} /><span>Projects</span></div>
            <div className="heading-row">
              <div><div className="title-line"><h1>Edge AI Visual Inspection Station</h1><button className="star-button" aria-label="Favorite project"><Star size={19} /></button></div><p>Deploy a production inspection cell using industrial vision to validate connector placement and enclosure labeling.</p></div>
              <div className="heading-actions"><span className="status-pill warning"><span />At risk</span><button className="phase-button">Validate<ChevronDown size={15} /></button><button className="icon-button"><MoreHorizontal size={19} /></button></div>
            </div>
            <div className="project-meta"><span>AXT-NPI-026</span><i /><span>Build EVT-03</span><i /><span>System Rev C</span><i /><span>Target Aug 14</span></div>
          </div>

          <div className="project-tabs" role="tablist">
            {["Overview", "Files", "Tasks", "Validation", "Decisions", "Activity"].map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}{tab === "Tasks" && <span>5</span>}{tab === "Validation" && <span className="warn-count">1</span>}</button>)}
          </div>

          {activeTab === "Overview" ? (
            <Overview files={files} onReveal={revealFile} onOpenSearch={() => setSearchOpen(true)} />
          ) : activeTab === "Files" ? (
            <FilesView files={visibleFiles} folders={folders} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} selectedFile={selectedFile} setSelectedFile={setSelectedFile} highlighted={highlighted} setDragging={setDragging} moveFile={moveFile} onUpload={() => uploadInput.current?.click()} />
          ) : (
            <EmptySection tab={activeTab} onGoFiles={() => setActiveTab("Files")} />
          )}
        </section>
      </main>

      {searchOpen && <SearchOverlay query={query} setQuery={setQuery} results={results} inputRef={searchInput} onClose={() => setSearchOpen(false)} onReveal={revealFile} onOpen={(file) => { setSelectedFile(file); setSearchOpen(false); }} />}
    </div>
  );
}

function Overview({ files, onReveal, onOpenSearch }: { files: ProjectFile[]; onReveal: (file: ProjectFile) => void; onOpenSearch: () => void }) {
  return <div className="overview">
    <button className="project-search" onClick={onOpenSearch}><Search size={18} /><span>Find anything in this project</span><kbd>/</kbd></button>
    <div className="attention-grid">
      <article className="attention-card"><div className="attention-icon blue"><Target size={18} /></div><div><span>Next milestone</span><strong>First article sign-off</strong><small>Jul 18 · 7 days remaining</small></div><ChevronRight size={18} /></article>
      <article className="attention-card blocker"><div className="attention-icon amber"><CircleAlert size={18} /></div><div><span>Current blocker</span><strong>Camera trigger drops after resume</strong><small>Vision software · Open 2 days</small></div><ChevronRight size={18} /></article>
      <article className="attention-card"><div className="attention-icon green"><CheckCircle2 size={18} /></div><div><span>Next action</span><strong>Complete 24-hour endurance test</strong><small>Due today · High priority</small></div><ChevronRight size={18} /></article>
    </div>
    <div className="overview-grid">
      <div className="main-column">
        <section className="panel workstreams-panel"><PanelTitle title="Project status" subtitle="4 active workstreams" action="View plan" />
          <div className="workstream-list">{workstreams.map((item) => <div className="workstream" key={item.name}><div className="workstream-top"><div><strong>{item.name}</strong><span>{item.detail}</span></div><span className={`state ${item.state.toLowerCase().replace(" ", "-")}`}>{item.state}</span></div><div className="progress-row"><div className="progress-track"><span style={{ width: `${item.value}%` }} /></div><b>{item.value}%</b></div></div>)}</div>
        </section>
        <section className="panel documents-panel"><PanelTitle title="Pinned & recent documents" subtitle="Updated across this project" action="View all files" />
          <div className="document-tabs"><button className="active">Recent</button><button>Pinned</button><button>Released</button></div>
          <div className="document-list">{files.slice(0, 5).map((file) => <button className="document-row" key={file.id} onClick={() => onReveal(file)}><span className={`file-icon ${file.kind}`}><KindIcon kind={file.kind} /></span><span className="document-name"><strong>{file.name}</strong><small>{file.path}</small></span><span className="revision">{file.revision}</span><span className={`file-status ${file.status.toLowerCase().replace(" ", "-")}`}>{file.status}</span><span className="modified">{file.modified}</span><ChevronRight size={16} /></button>)}</div>
        </section>
      </div>
      <aside className="context-column">
        <section className="panel facts-panel"><PanelTitle title="Project facts" /><dl><div><dt>Target release</dt><dd>August 14, 2026</dd></div><div><dt>Current build</dt><dd><code>EVT-03</code></dd></div><div><dt>System revision</dt><dd><code>Rev C</code></dd></div><div><dt>Project phase</dt><dd>Validate</dd></div></dl><div className="tag-row"><span>machine-vision</span><span>NPI</span><span>edge-AI</span></div></section>
        <section className="panel activity-panel"><PanelTitle title="Recent activity" action="View all" /><div>{activities.map(({ icon: Icon, text, meta, tone }) => <div className="activity-item" key={text}><span className={`activity-icon ${tone}`}><Icon size={15} /></span><p><strong>{text}</strong><small>{meta}</small></p></div>)}</div></section>
        <section className="panel storage-panel"><div className="storage-top"><span className="attention-icon blue"><HardDrive size={18} /></span><div><strong>Project storage</strong><small>4.8 GB of 100 GB</small></div><span>5%</span></div><div className="progress-track"><span style={{ width: "5%" }} /></div></section>
      </aside>
    </div>
  </div>;
}

function FilesView({ files, folders, selectedFolder, setSelectedFolder, selectedFile, setSelectedFile, highlighted, setDragging, moveFile, onUpload }: { files: ProjectFile[]; folders: { id: string; name: string; count: number }[]; selectedFolder: string; setSelectedFolder: (id: string) => void; selectedFile: ProjectFile | null; setSelectedFile: (file: ProjectFile | null) => void; highlighted: string | null; setDragging: (id: string | null) => void; moveFile: (event: DragEvent, folder: string) => void; onUpload: () => void }) {
  const folderName = folders.find((folder) => folder.id === selectedFolder)?.name ?? "Files";
  return <div className="files-layout">
    <aside className="folder-pane"><div className="folder-header"><strong>Folders</strong><button aria-label="Add folder"><Plus size={15} /></button></div>{folders.map((folder, index) => <button key={folder.id} className={`folder-row ${selectedFolder === folder.id ? "active" : ""}`} onClick={() => setSelectedFolder(folder.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => moveFile(event, folder.id)}>{index === 0 ? <Blocks size={17} /> : <FolderClosed size={17} />}<span>{folder.name}</span><small>{folder.count}</small></button>)}</aside>
    <section className="file-pane"><div className="file-toolbar"><div><span>Axiomtek Systems</span><ChevronRight size={13} /><strong>{folderName}</strong></div><div><button className="toolbar-button"><SlidersHorizontal size={16} />Filter</button><div className="view-switch"><button className="active"><List size={16} /></button><button><Grid2X2 size={16} /></button></div><button className="primary-button" onClick={onUpload}><Upload size={16} />Upload</button></div></div>
      <div className="file-table"><div className="file-table-head"><span>Name</span><span>Revision</span><span>Status</span><span>Modified</span><span>Size</span><span /></div>{files.length ? files.map((file) => <button draggable key={file.id} className={`file-table-row ${highlighted === file.id ? "highlight" : ""} ${selectedFile?.id === file.id ? "selected" : ""}`} onDragStart={() => setDragging(file.id)} onDragEnd={() => setDragging(null)} onClick={() => setSelectedFile(file)}><span className="file-main"><span className={`file-icon ${file.kind}`}><KindIcon kind={file.kind} /></span><span><strong>{file.name}</strong><small>{file.path}</small></span></span><span>{file.revision}</span><span><i className={`status-dot ${file.status.toLowerCase().replace(" ", "-")}`} />{file.status}</span><span>{file.modified}</span><span>{file.size}</span><MoreHorizontal size={17} /></button>) : <div className="empty-folder"><Folder size={34} /><strong>This folder is empty</strong><span>Drag files here or upload a new document.</span><button className="primary-button" onClick={onUpload}><Upload size={16} />Upload files</button></div>}</div>
    </section>
    {selectedFile && <aside className="inspector"><div className="inspector-head"><span>File details</span><button onClick={() => setSelectedFile(null)}><X size={18} /></button></div><div className={`preview-tile ${selectedFile.kind}`}><KindIcon kind={selectedFile.kind} size={34} /><span>{selectedFile.kind === "code" ? "Source preview" : selectedFile.kind === "image" ? "Image preview" : "Preview processing"}</span></div><h3>{selectedFile.name}</h3><p>{selectedFile.snippet}</p><dl><div><dt>Location</dt><dd>{selectedFile.path}</dd></div><div><dt>Revision</dt><dd>{selectedFile.revision}</dd></div><div><dt>Status</dt><dd>{selectedFile.status}</dd></div><div><dt>Size</dt><dd>{selectedFile.size}</dd></div></dl><button className="inspector-action"><Clock3 size={16} />Revision history</button><button className="inspector-action"><ArrowLeft size={16} />Open full preview</button></aside>}
  </div>;
}

function SearchOverlay({ query, setQuery, results, inputRef, onClose, onReveal, onOpen }: { query: string; setQuery: (value: string) => void; results: ProjectFile[]; inputRef: React.RefObject<HTMLInputElement | null>; onClose: () => void; onReveal: (file: ProjectFile) => void; onOpen: (file: ProjectFile) => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="search-modal" role="dialog" aria-modal="true" aria-label="Search Nibble" onMouseDown={(event) => event.stopPropagation()}><div className="search-input-wrap"><Search size={21} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, files, contents, document numbers…" /><kbd>esc</kbd></div><div className="filter-chips"><button className="active">This project</button><button>Word</button><button>Excel</button><button>PDFs</button><button>Scripts</button><button>Images</button></div><div className="search-body"><div className="search-section-label"><span>{query ? `${results.length} results` : "Recently opened"}</span><small>Indexed filename, metadata & content</small></div>{results.length ? results.map((file, index) => <div className="search-result" key={file.id}><button className="result-open" onClick={() => onOpen(file)}><span className={`file-icon ${file.kind}`}><KindIcon kind={file.kind} size={20} /></span><span className="result-copy"><strong>{file.name}</strong><span>{file.snippet}</span><small>Axiomtek Systems <ChevronRight size={11} /> Edge AI Inspection <ChevronRight size={11} /> {file.path}</small></span><span className="result-meta"><i>{index === 0 && query ? "Best match" : file.status}</i><small>{file.revision} · {file.modified}</small></span></button><button className="reveal-button" onClick={() => onReveal(file)} title="Reveal in project"><FolderKanban size={17} /></button></div>) : <div className="no-results"><Search size={31} /><strong>No indexed items found</strong><span>Try a filename, document number, project, or content phrase.</span></div>}</div><footer className="search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><FolderKanban size={13} /> Reveal in project</span><b>Nibble Search</b></footer></section></div>;
}

function PanelTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) { return <div className="panel-title"><div><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div>{action && <button>{action}<ChevronRight size={14} /></button>}</div>; }

function EmptySection({ tab, onGoFiles }: { tab: string; onGoFiles: () => void }) { const Icon = tab === "Tasks" ? CheckCircle2 : tab === "Validation" ? ShieldCheck : tab === "Decisions" ? Blocks : Activity; return <div className="section-placeholder"><span><Icon size={28} /></span><h2>{tab} workspace</h2><p>This module is part of the next build pass. The cockpit and indexed file workspace are ready to explore now.</p><button className="primary-button" onClick={onGoFiles}>Explore project files<ChevronRight size={16} /></button></div>; }
