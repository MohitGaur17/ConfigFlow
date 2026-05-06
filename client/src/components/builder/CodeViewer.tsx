"use client";

import React, { useState, useMemo } from "react";
import { FileCode, FileJson, Database, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { AppConfig } from "@/lib/config-context";

interface CodeViewerProps {
  config: AppConfig;
}

export default function CodeViewer({ config }: CodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState("prisma/schema.prisma");

  // Generate virtual files based on config
  const files = useMemo(() => {
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
    };
  }, [config]);

  return (
    <div className="flex h-full bg-[#0D0D0D]">
      {/* Explorer Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col shrink-0">
        <div className="px-4 py-3 text-[10px] font-bold text-white/40 tracking-widest uppercase border-b border-white/5">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <FileTree 
            files={Object.keys(files)} 
            selectedFile={selectedFile} 
            onSelect={setSelectedFile} 
          />
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 bg-[#151515] border-b border-white/5 flex items-center px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0D0D0D] border-t border-x border-indigo-500/50 text-xs text-indigo-300 rounded-t-sm shrink-0">
            {selectedFile.split('/').pop()}
          </div>
        </div>
        <div className="flex-1 p-6 overflow-auto font-mono text-sm leading-relaxed">
          <pre className="text-gray-300">
            <code>{(files as any)[selectedFile]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function FileTree({ files, selectedFile, onSelect }: { files: string[], selectedFile: string, onSelect: (f: string) => void }) {
  return (
    <div className="space-y-0.5">
      {files.sort().map(file => (
        <div 
          key={file}
          onClick={() => onSelect(file)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
            selectedFile === file ? "bg-indigo-500/10 text-indigo-300" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          {file.endsWith('.prisma') ? <Database className="w-3.5 h-3.5 text-orange-400" /> : 
           file.endsWith('.json') ? <FileJson className="w-3.5 h-3.5 text-yellow-400" /> :
           <FileCode className="w-3.5 h-3.5 text-blue-400" />}
          <span className="truncate">{file}</span>
        </div>
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
