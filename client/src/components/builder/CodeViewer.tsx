"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FileCode, FileJson, Database, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { AppConfig } from "@/lib/config-context";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface CodeViewerProps {
  config: AppConfig;
}

export default function CodeViewer({ config }: CodeViewerProps) {
  const localFiles = useMemo(() => {
    const entityNames = Object.keys(config.entities);

    return {
      "prisma/schema.prisma": generatePrismaSchema(config),
      "package.json": generatePackageJson(config),
      "src/app/page.tsx": generateHomePage(config),
      ...entityNames.reduce((acc, name) => ({
        ...acc,
        [`src/app/api/${name}/route.ts`]: generateApiRoute(name, config.entities[name]),
      }), {}),
      ".env": `DATABASE_URL="postgresql://user:pass@localhost:5432/${config.app.name.toLowerCase().replace(/\s+/g, '_')}"\nNEXTAUTH_SECRET="your-secret"`
    } as Record<string, string>;
  }, [config]);

  const params = useParams();
  const appId = params?.appId as string | undefined;

  const [remoteFiles, setRemoteFiles] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!appId) return;
    let mounted = true;
    api.get(`/apps/${appId}/files`).then(res => {
      if (!mounted) return;
      if (res.data?.success && res.data.data?.files) setRemoteFiles(res.data.data.files);
    }).catch(() => {
      setRemoteFiles(null);
    });
    return () => { mounted = false; };
  }, [appId]);

  const files = remoteFiles ?? localFiles;
  const fileKeys = Object.keys(files).sort();
  const [selectedFile, setSelectedFile] = useState<string>(fileKeys[0] ?? "");

  useEffect(() => {
    if (!selectedFile && fileKeys.length > 0) setSelectedFile(fileKeys[0]);
    if (selectedFile && !fileKeys.includes(selectedFile)) setSelectedFile(fileKeys[0] ?? "");
  }, [fileKeys, selectedFile]);

  return (
    <div className="flex h-full bg-[#09090B] text-white">
      {/* Explorer Sidebar */}
      <div className="w-72 border-r border-white/10 bg-[#0F1115] flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <div className="text-[10px] font-bold text-white/40 tracking-[0.28em] uppercase">Explorer</div>
            <div className="mt-1 text-xs text-white/65">Project files</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/55">
            {fileKeys.length} files
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <FileTree 
            files={fileKeys} 
            selectedFile={selectedFile} 
            onSelect={setSelectedFile} 
          />
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-11 bg-[#111318] border-b border-white/10 flex items-center px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-indigo-500/40 bg-[#09090B] px-3 py-2 text-xs text-indigo-200 shadow-[0_-1px_0_rgba(129,140,248,0.35)] shrink-0">
            <FileCode className="w-3.5 h-3.5" />
            <span className="max-w-[18rem] truncate">{selectedFile ? selectedFile.split('/').pop() : 'No file selected'}</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#09090B] p-5 font-mono text-sm leading-relaxed">
          <pre className="rounded-xl border border-white/10 bg-[#0D0F13] p-5 text-gray-300 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <code>{selectedFile ? files[selectedFile] : 'Select a file from the explorer to view its contents.'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function FileTree({ files, selectedFile, onSelect }: { files: string[], selectedFile: string, onSelect: (f: string) => void }) {
  type Node = {
    name: string;
    path: string;
    children?: Record<string, Node>;
    isFile: boolean;
  };

  function buildTree(paths: string[]) {
    const root: Record<string, Node> = {};
    for (const p of paths) {
      const parts = p.split('/');
      let cursor = root;
      let builtPath = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        builtPath = builtPath ? `${builtPath}/${part}` : part;
        if (!cursor[part]) {
          cursor[part] = { name: part, path: builtPath, isFile: i === parts.length - 1 };
        }
        if (i < parts.length - 1) {
          cursor[part].children = cursor[part].children || {};
          cursor = cursor[part].children!;
        }
      }
    }
    return root;
  }

  const tree = buildTree(files);

  const initialOpenFolders = useMemo(() => {
    const defaults = new Set<string>(["src", "src/app", "src/app/api", "prisma"]);
    for (const path of files) {
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i++) {
        defaults.add(parts.slice(0, i).join("/"));
      }
    }
    return defaults;
  }, [files]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => initialOpenFolders);

  useEffect(() => {
    setOpenFolders(initialOpenFolders);
  }, [initialOpenFolders]);

  const toggleFolder = useCallback((path: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  function FolderItem({ node, depth = 0 }: { node: Node; depth?: number }) {
    const isFile = node.isFile;

    if (isFile) {
      const icon = node.path.endsWith('.prisma') ? <Database className="w-3.5 h-3.5 text-orange-400" /> : node.path.endsWith('.json') ? <FileJson className="w-3.5 h-3.5 text-yellow-400" /> : <FileCode className="w-3.5 h-3.5 text-sky-400" />;
      return (
        <button
          type="button"
          onClick={() => onSelect(node.path)}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
            selectedFile === node.path
              ? "bg-indigo-500/15 text-indigo-200 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]"
              : "text-white/65 hover:bg-white/5 hover:text-white"
          }`}
          style={{ paddingLeft: depth * 14 + 10 }}
        >
          {icon}
          <span className="truncate">{node.name}</span>
        </button>
      );
    }

    const children = Object.values(node.children || {}).sort((a, b) => a.name.localeCompare(b.name));
    const open = openFolders.has(node.path);

    return (
      <div>
        <button
          type="button"
          onClick={() => toggleFolder(node.path)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          style={{ paddingLeft: depth * 14 + 6 }}
        >
          {open ? <ChevronDown className="w-3.5 h-3.5 text-white/55" /> : <ChevronRight className="w-3.5 h-3.5 text-white/55" />}
          <Folder className="w-3.5 h-3.5 text-amber-300" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div className="mt-0.5 border-l border-white/5 ml-4 pl-1">
            {children.map(child => (
              <FolderItem key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const rootNodes = Object.values(tree).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-0.5">
      {rootNodes.map(node => (
        <FolderItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}

// --- Generator Helpers (Mirrors code-generator.ts) ---

function generatePrismaSchema(config: AppConfig) {
  let schema = `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;
  
  for (const [name, entity] of Object.entries(config.entities)) {
    schema += `model ${name.charAt(0).toUpperCase() + name.slice(1)} {\n  id        String   @id @default(cuid())\n`;
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      let type = "String";
      if (field.type === "number") type = "Int";
      if (field.type === "boolean") type = "Boolean";
      if (field.type === "date" || field.type === "datetime") type = "DateTime";
      schema += `  ${fieldName} ${type}${field.required ? "" : "?"}\n`;
    }
    schema += `  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\n`;
  }
  return schema;
}

function generatePackageJson(config: AppConfig) {
  return JSON.stringify({
    name: config.app.name.toLowerCase().replace(/\s+/g, '-'),
    version: "0.1.0",
    dependencies: {
      "next": "14.2.0",
      "react": "^18",
      "@prisma/client": "^5.12.0",
      "lucide-react": "^0.368.0",
      "zod": "^3.22.4"
    }
  }, null, 2);
}

function generateHomePage(config: AppConfig) {
  return `"use client";\n\nexport default function Home() {\n  return (\n    <main className="p-8">\n      <h1 className="text-3xl font-bold">${config.app.name}</h1>\n      <p className="mt-4 text-gray-600">${config.app.description || 'Welcome to your generated app.'}</p>\n    </main>\n  );\n}`;
}

function generateApiRoute(entityName: string, entity: any) {
  return `import { NextResponse } from 'next/server';\nimport { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();\n\nexport async function GET() {\n  const data = await prisma.${entityName.toLowerCase()}.findMany();\n  return NextResponse.json(data);\n}`;
}
