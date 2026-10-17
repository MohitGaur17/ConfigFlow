import { AppConfig, EntityConfig, TablePageConfig, FormPageConfig, DashboardPageConfig, DetailPageConfig } from "shared";

// ============================================================
// Code Generator Service — Generates a full Next.js + Prisma
// codebase from a JSON AppConfig.
// ============================================================

export type VirtualFileSystem = Map<string, string>;

export function generateCodebase(config: AppConfig): VirtualFileSystem {
  const emailAuth = config.app.auth?.providers?.email !== false;
  const generatedAuthEnabled = Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped);
  const oauthRequested = config.app.auth?.providers?.google === true || config.app.auth?.providers?.github === true;
  const authModelCollision = Object.keys(config.entities).find((name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}` === "User");
  if (generatedAuthEnabled && authModelCollision) {
    throw new Error(`Entity "${authModelCollision}" conflicts with the generated authentication User model. Rename the entity before enabling authentication.`);
  }
  if (oauthRequested) {
    throw new Error("Generated projects currently support email/password authentication only. Disable Google and GitHub providers before generation.");
  }
  if (!config.app.auth?.enabled) {
    const privateEntities = Object.entries(config.entities).filter(([, entity]) => !entity.userScoped && entity.publicAccess !== true);
    const hasMutatingPages = config.pages.some((page) =>
      (page.type === "form" || (page.type === "table" && (page.actions || ["create", "edit", "delete"]).length > 0)) &&
      !("entity" in page && config.entities[page.entity]?.userScoped)
    );
    if (privateEntities.length || hasMutatingPages) {
      throw new Error("Authentication-disabled generated projects are public read-only apps. Mark every entity publicAccess: true and remove forms and table mutations, or enable email authentication.");
    }
  }
  if (generatedAuthEnabled && !emailAuth) {
    throw new Error("Generated projects require the email authentication provider when authentication is enabled.");
  }

  const vfs = new Map<string, string>();

  // 1. Configs
  vfs.set("package.json", generatePackageJson(config));
  vfs.set("tsconfig.json", generateTsConfig());
  vfs.set("tailwind.config.ts", generateTailwindConfig());
  vfs.set("postcss.config.js", generatePostcssConfig());
  vfs.set("next.config.js", generateNextConfig());

  // 2. Database
  vfs.set("prisma/schema.prisma", generatePrismaSchema(config));
  vfs.set("src/lib/prisma.ts", generatePrismaClient());
  vfs.set("src/lib/api-auth.ts", generateApiAuth(config));
  vfs.set("src/lib/api-validation.ts", generateApiValidation());

  // 3. App Core
  vfs.set("src/app/globals.css", generateGlobalsCss());
  vfs.set("src/app/layout.tsx", generateRootLayout(config));
  vfs.set("src/app/page.tsx", generateHomePage(config));
  vfs.set("src/app/auth/page.tsx", generateAuthPage(config));
  vfs.set("src/app/api/auth/providers/route.ts", generateAuthProvidersRoute(config));
  if (config.app.auth?.enabled || Object.values(config.entities).some((entity) => entity.userScoped)) {
    vfs.set("src/app/api/auth/[action]/route.ts", generateAuthRoute());
  }
    vfs.set("src/components/PwaRegister.tsx", generatePwaRegister());

    // 3b. PWA assets
    vfs.set("src/app/manifest.ts", generateManifest(config));
    vfs.set("public/sw.js", generateServiceWorker());
    vfs.set("public/icon.svg", generateIconSvg(config));
    vfs.set("public/apple-touch-icon.svg", generateIconSvg(config));

  // 4. API Routes
  for (const [entityName, entityConfig] of Object.entries(config.entities)) {
    vfs.set(`src/app/api/${entityName}/route.ts`, generateApiRoute(entityName, entityConfig, config));
    vfs.set(`src/app/api/${entityName}/[id]/route.ts`, generateApiIdRoute(entityName, entityConfig, config));
  }

  // 5. Pages
  for (const page of config.pages) {
    const normalizedPath = page.path.replace(/^\//, "");
    if (page.type === "table") {
      vfs.set(`src/app/(pages)/${normalizedPath}/page.tsx`, generateTablePage(page, config.entities[page.entity]));
    }

    if (page.type === "form") {
      vfs.set(`src/app/(pages)/${normalizedPath}/page.tsx`, generateFormPage(page, config.entities[page.entity]));
    }

    if (page.type === "dashboard") {
      vfs.set(`src/app/(pages)/${normalizedPath}/page.tsx`, generateDashboardPage(page));
    }

    if (page.type === "detail") {
      vfs.set(`src/app/(pages)/${normalizedPath}/page.tsx`, generateDetailPage(page));
    }
  }

  // 6. Environment example and README + seed script
  vfs.set(".env.example", generateEnvExample());
  vfs.set("README.md", generateGeneratedReadme(config));
  vfs.set("prisma/seed.js", generatePrismaSeed(config));

  // 7. Manifest of generated files
  vfs.set("GENERATED_FILES.txt", Array.from(vfs.keys()).join("\n"));

  return vfs;
}

function generateEnvExample(): string {
  const lines = [
    '# Copy to .env and fill in your values',
    'DATABASE_URL="postgresql://user:password@localhost:5432/your_database"',
    'AUTH_SECRET="replace-with-at-least-32-random-characters"',
  ];
  return lines.join('\n') + '\n';
}

function generateGeneratedReadme(config: AppConfig): string {
  const authEnabled = Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped);
  const lines = [
    `# ${config.app.name}`,
    '',
    'This project was generated by ConfigFlow.',
    '',
    'Quick start',
    '',
    '1. Copy .env.example to .env and set your DATABASE_URL.',
    '2. Install dependencies:',
    '',
    '   npm install',
    '',
    '3. Push the Prisma schema to your database and create tables:',
    '',
    '   npx prisma db push',
    '',
    '4. (Optional) Seed the database with example records:',
    '',
    '   node prisma/seed.js',
    '',
    '5. Run the dev server:',
    '',
    '   npm run dev',
    '',
    'Authentication and access policy',
    authEnabled
      ? '- Email/password registration and login are supported. Set a long random AUTH_SECRET before starting the app.'
      : '- This app is public and read-only. Only entities explicitly marked publicAccess: true are exposed.',
    '- Google and GitHub OAuth are not supported by generated projects; generation fails if either provider is enabled.',
    '- User-scoped entities are filtered by the authenticated user on every list, read, update, delete, and aggregate query.',
    '- Email verification and password reset are not implemented in generated projects.',

      'PWA',

      '- The generated app includes a web manifest, installable icons, and a service worker.',
      '- Open the app in a supported browser to install it to your device or desktop.',
    '',
    'Notes',
    '- The Prisma schema is under prisma/schema.prisma.',
    '- prisma/seed.js creates sample records for entities that are not user-scoped.',
  ];
  return lines.join('\n') + '\n';
}

function generatePrismaSeed(config: AppConfig): string {
  const lines: string[] = [
    "const { PrismaClient } = require('@prisma/client');",
    'const prisma = new PrismaClient();',
    '',
    'async function main() {',
  ];

  for (const [entityName, entityConfig] of Object.entries(config.entities)) {
    if (entityConfig.userScoped) {
      lines.push(`  // ${entityName} is user-scoped and is created after a user registers.`);
      continue;
    }
    const modelName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    const sample: Record<string, any> = {};
    for (const [fieldName, field] of Object.entries(entityConfig.fields)) {
      if (field.type === 'number') sample[fieldName] = 1;
      else if (field.type === 'boolean') sample[fieldName] = false;
      else if (field.type === 'date') sample[fieldName] = new Date().toISOString();
      else sample[fieldName] = `${fieldName} example`;
    }

    lines.push(`  // Create sample for ${modelName}`);
    lines.push(`  await prisma.${modelName.toLowerCase()}.create({ data: ${JSON.stringify(sample)} });`);
    lines.push('');
  }

  lines.push("  console.log('Seed completed');");
  lines.push('}');
  lines.push('');
  lines.push('main()');
  lines.push('  .catch((e) => { console.error(e); process.exit(1); })');
  lines.push('  .finally(async () => { await prisma.$disconnect(); });');

  return lines.join('\n');
}

function generatePackageJson(config: AppConfig): string {
  return JSON.stringify({
    name: config.app.name.toLowerCase().replace(/\s+/g, "-"),
    version: "0.1.0",
    private: true,
    engines: {
      node: ">=20.9.0"
    },
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "db:push": "prisma db push",
      "db:studio": "prisma studio"
    },
    dependencies: {
      "@prisma/client": "^5.22.0",
      "bcryptjs": "^2.4.3",
      "jsonwebtoken": "^9.0.2",
      "lucide-react": "^1.14.0",
      "next": "^16.2.0",
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "recharts": "^2.12.7"
    },
    devDependencies: {
      "@types/node": "^20",
      "@types/bcryptjs": "^2.4.6",
      "@types/jsonwebtoken": "^9.0.6",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      "autoprefixer": "^10.4.19",
      "postcss": "^8",
      "prisma": "^5.22.0",
      "tailwindcss": "^3.4.1",
      "typescript": "^5"
    }
  }, null, 2);
}

function generateTsConfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
}

function generateTailwindConfig(): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        background: "#ffffff",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;`;
}

function generateTablePage(page: TablePageConfig, entityConfig?: EntityConfig): string {
  const columns = (page.columns && page.columns.length > 0) ? page.columns : Object.keys(entityConfig?.fields || {});
  const searchable = page.searchable !== false;
  const actions = page.actions || ["create", "edit", "delete"];
  const fields = Object.entries(entityConfig?.fields || {}).map(([key, f]) => ({
    name: key,
    type: f.type,
    required: Boolean(f.required),
    label: f.label || key,
    options: f.options || [],
  }));

  return `"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

const columns = ${JSON.stringify(columns)};
const entityFields = ${JSON.stringify(fields)};

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    fetch("/api/${page.entity}")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    if (!query) return data;
    const search = query.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(search))
    );
  }, [data, query]);

  const canCreate = ${actions.includes("create")};
  const canEdit = ${actions.includes("edit")};
  const canDelete = ${actions.includes("delete")};

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const initial: Record<string, any> = {};
    entityFields.forEach((f) => { initial[f.name] = ""; });
    setFormData(initial);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    const initial: Record<string, any> = {};
    entityFields.forEach((f) => { initial[f.name] = record[f.name] ?? ""; });
    setFormData(initial);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch("/api/${page.entity}/" + id, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const url = editingRecord ? "/api/${page.entity}/" + editingRecord.id : "/api/${page.entity}";
      const method = editingRecord ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save record");

      if (editingRecord) {
        setData((prev) => prev.map((r) => (r.id === editingRecord.id ? json.data : r)));
      } else {
        setData((prev) => [json.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">${page.name}</p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-4xl">${page.name}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            ${searchable ? `<label className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search records"
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </label>` : ""}
            {canCreate && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />Add
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading data...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No records found.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    {columns.map((key) => (
                      <th key={key} className="p-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{key}</th>
                    ))}
                    {(canEdit || canDelete) && <th className="p-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.map((row) => (
                    <tr key={row.id} className="transition hover:bg-white/[0.03]">
                      {columns.map((key) => (
                        <td key={key} className="p-4 text-sm text-slate-300">{String(row[key] ?? "—")}</td>
                      ))}
                      {(canEdit || canDelete) && (
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEdit(row)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredData.map((row) => (
                <article key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  {columns.map((key) => (
                    <div key={key} className="mb-3 last:mb-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{key}</div>
                      <div className="mt-1 break-words text-sm text-slate-200">{String(row[key] ?? "—")}</div>
                    </div>
                  ))}
                  {(canEdit || canDelete) && (
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">{editingRecord ? "Edit Record" : "Add New Record"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {formError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {formError}
              </div>
            )}
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {entityFields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {field.label}{field.required ? " *" : ""}
                  </label>
                  {field.type === "boolean" ? (
                    <select
                      value={String(formData[field.name] ?? "")}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value === "true" }))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : field.type === "enum" ? (
                    <select
                      value={String(formData[field.name] ?? "")}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={String(formData[field.name] ?? "")}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`;
}

function generateFormPage(page: FormPageConfig, entityConfig?: EntityConfig): string {
  const fieldNames = page.fields && page.fields.length > 0 ? page.fields : Object.keys(entityConfig?.fields || {});
  const fieldMeta = fieldNames.map((fieldName) => {
    const field = (entityConfig?.fields[fieldName] || { type: "string" }) as any;
    return {
      name: fieldName,
      type: field.type,
      required: Boolean(field.required),
      label: field.label || fieldName,
      placeholder: field.placeholder || "",
      options: field.options || [],
    };
  });

  return `"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const fields = ${JSON.stringify(fieldMeta, null, 2)};

export default function Page() {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, unknown> = {};
    for (const field of fields) initial[field.name] = "";
    setFormData(initial);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/${page.entity}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create record");
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <CheckCircle2 className="h-14 w-14 text-emerald-400" />
        <p className="text-lg text-white/80">Saved successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">${page.name}</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-4xl">${page.name}</h1>
      </section>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <span className="block text-sm font-medium text-slate-200">{field.label}{field.required ? " *" : ""}</span>
            {field.type === "text" ? (
              <textarea
                value={String(formData[field.name] ?? "")}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
            ) : field.type === "boolean" ? (
              <select
                value={String(formData[field.name] ?? "")}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value === "true" }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              >
                <option value="">Select</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : field.type === "enum" ? (
              <select
                value={String(formData[field.name] ?? "")}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              >
                <option value="">Select</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input
                value={String(formData[field.name] ?? "")}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
            )}
          </label>
        ))}
      </div>

      <button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:opacity-60">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}`;
}
function generatePostcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
}

function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;`;
}

function generateManifest(config: AppConfig): string {
  const safeName = config.app.name.replace(/"/g, '\\"');
  const safeShortName = config.app.name.slice(0, 12).replace(/"/g, '\\"');
  const safeDesc = (config.app.description || "Generated app").replace(/"/g, '\\"');
  const themeColor = config.app.theme?.primaryColor || "#6366f1";

  return `import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "${safeName}",
    short_name: "${safeShortName}",
    description: "${safeDesc}",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "${themeColor}",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
`;
}

function generateServiceWorker(): string {
  return `const CACHE_NAME = "configflow-app-v1";
const ASSETS = ["/", "/manifest.webmanifest", "/icon.svg", "/apple-touch-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("/"));
    })
  );
});`;
}

function generateIconSvg(config: AppConfig): string {
  // Use the shared favicon artwork so generated apps match the main brand SVG.
  // This returns a compact square SVG (180x180 viewBox) and sets aria-label to the app name.
  const safeLabel = String(config.app.name || "App").replace(/"/g, "'");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" fill="none" role="img" aria-label="${safeLabel}">\n  <defs>\n    <linearGradient id="configflowFaviconGrad" x1="0%" y1="0%" x2="100%" y2="100%">\n      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />\n      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />\n    </linearGradient>\n  </defs>\n  <rect width="180" height="180" fill="url(#configflowFaviconGrad)" rx="40"/>\n  <g fill="#ffffff">\n    <rect x="43" y="43" width="36" height="36" rx="10"/>\n    <rect x="92" y="43" width="26" height="26" rx="8" opacity="0.92"/>\n    <rect x="43" y="92" width="26" height="26" rx="8" opacity="0.92"/>\n    <rect x="81" y="81" width="39" height="39" rx="11"/>\n  </g>\n</svg>`;
}

function generatePwaRegister(): string {
  return `"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore install-time failures in unsupported browsers.
    });
  }, []);

  return null;
}`;
}

function generatePrismaSchema(config: AppConfig): string {
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  const hasUsers = Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped);
  if (hasUsers) {
    const scopedModelRelations = Object.entries(config.entities)
      .filter(([, entity]) => entity.userScoped)
      .map(([name]) => `${name.charAt(0).toUpperCase()}${name.slice(1)}[]`);
    schema += `model User {
  id String @id @default(uuid())
  email String @unique
  passwordHash String
  name String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
${scopedModelRelations.map((relation, index) => `  records${index || ""} ${relation}`).join("\n")}
}

`;
  }

  for (const [entityName, entityConfig] of Object.entries(config.entities)) {
    // Capitalize first letter
    const modelName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    schema += `model ${modelName} {\n`;
    schema += `  id String @id @default(uuid())\n`;
    if (entityConfig.userScoped) {
      schema += `  userId String\n`;
      schema += `  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n`;
    }
    
    for (const [fieldName, field] of Object.entries(entityConfig.fields)) {
      let type = "String";
      if (field.type === "number") type = "Float";
      if (field.type === "boolean") type = "Boolean";
      if (field.type === "date" || field.type === "datetime") type = "DateTime";
      
      const optional = field.required ? "" : "?";
      schema += `  ${fieldName} ${type}${optional}\n`;
    }
    
    schema += `  createdAt DateTime @default(now())\n`;
    schema += `  updatedAt DateTime @updatedAt\n`;
    if (entityConfig.userScoped) schema += `  @@index([userId])\n`;
    schema += `}\n\n`;
  }

  return schema;
}

function generatePrismaClient(): string {
  return `import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma`;
}

function generateGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(99, 102, 241, 0.12), transparent 36%),
    linear-gradient(180deg, #020617 0%, #0f172a 100%);
  color: #e5e7eb;
}

* {
  box-sizing: border-box;
}

::selection {
  background: rgba(99, 102, 241, 0.35);
  color: white;
}`;
}

function generateRootLayout(config: AppConfig): string {
  const pages = config.pages.map((page) => ({ name: page.name, path: page.path }));
  const desktopLinks = pages
    .map((page) => `              <Link href="${page.path}" className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">${page.name}</Link>`)
    .join("\n");
  const mobileLinks = pages
    .slice(0, 4)
    .map((page) => `                <Link href="${page.path}" className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-medium text-slate-300 transition active:scale-[0.98]">${page.name}</Link>`)
    .join("\n");
  const topLinks = pages
    .map((page) => `                <Link href="${page.path}" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200">${page.name}</Link>`)
    .join("\n");

  return `import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "${config.app.name.replace(/"/g, '\\"')}",
  description: "Generated by ConfigFlow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "${config.app.name.replace(/"/g, '\\"')}",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "${config.app.theme?.primaryColor || "#6366f1"}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <PwaRegister />
        <div className="min-h-screen md:flex">
          <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-white/10 md:bg-slate-950/80 md:backdrop-blur-xl">
            <div className="border-b border-white/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300/70">ConfigFlow</p>
              <h1 className="mt-3 text-2xl font-bold text-white">${config.app.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">${config.app.description || "A responsive app generated from your configuration."}</p>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
${desktopLinks}
            </nav>
          </aside>

          <div className="flex min-h-screen flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-xl md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-300/70">ConfigFlow</p>
                  <h1 className="text-base font-semibold text-white">${config.app.name}</h1>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">PWA ready</span>
              </div>
              <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
${topLinks}
              </nav>
            </header>

            <main className="flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-8">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 px-2 py-2 backdrop-blur-xl md:hidden">
              <div className="grid grid-cols-4 gap-2">
${mobileLinks}
              </div>
            </nav>
          </div>
        </div>
      </body>
    </html>
  );
}`;
}

function generateHomePage(config: AppConfig): string {
  return `"use client";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const authEnabled = ${JSON.stringify(Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped))};
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">Overview</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">${config.app.name}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">${config.app.description || 'Welcome to your generated app.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-80">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-slate-400">Responsive</div>
              <div className="mt-1 font-semibold text-white">Mobile first</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-slate-400">Installable</div>
              <div className="mt-1 font-semibold text-white">PWA ready</div>
            </div>
          </div>
        </div>
      </section>
      {authEnabled && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-soft md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">Authentication</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Secure sign-in is enabled for this app</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">Create an account or sign in with email and password. User-scoped data stays private to its owner.</p>
          <div className="mt-5">
            <a href="/auth" className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400">
              Open auth screen
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Fast setup</p>
          <p className="mt-2 text-lg font-semibold text-white">Generate, deploy, install</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Responsive layout</p>
          <p className="mt-2 text-lg font-semibold text-white">Sidebar on desktop, bottom nav on mobile</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Offline ready</p>
          <p className="mt-2 text-lg font-semibold text-white">Manifest + service worker</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Data driven</p>
          <p className="mt-2 text-lg font-semibold text-white">Entity pages scale to your config</p>
        </div>
      </div>
    </div>
  );
}`;
}

function generateAuthProvidersRoute(config: AppConfig): string {
  const enabled = Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped);
  return `import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ success: true, data: { enabled: ${JSON.stringify(enabled)}, email: ${JSON.stringify(enabled)}, google: false, github: false } });
}`;
}

function generateSupportedAuthPage(config: AppConfig): string {
  return `"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/" + mode, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Authentication failed");
      router.push("/"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Authentication failed"); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center bg-slate-950 p-6 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
    <h1 className="text-3xl font-bold">${config.app.name}</h1><p className="mt-2 text-slate-300">{mode === "register" ? "Create your account" : "Sign in with email and password"}</p>
    <div className="mt-6 grid grid-cols-2 rounded-xl bg-black/30 p-1"><button type="button" onClick={() => setMode("login")} className="rounded-lg p-2">Sign in</button><button type="button" onClick={() => setMode("register")} className="rounded-lg p-2">Register</button></div>
    <form onSubmit={submit} className="mt-6 space-y-4">{mode === "register" && <label className="block text-sm">Name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl bg-black/30 p-3" maxLength={100} /></label>}
      <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl bg-black/30 p-3" /></label>
      <label className="block text-sm">Password<input type="password" required minLength={12} maxLength={128} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl bg-black/30 p-3" /></label>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-indigo-500 p-3 font-semibold disabled:opacity-50">{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button></form>
    <p className="mt-5 text-xs text-slate-400">Email and password sign-in is supported. OAuth, email verification, and password reset are not available in generated projects.</p>
  </section></main>;
}`;
}

function generateAuthRoute(): string {
  return `import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const COOKIE = "configflow_session";
function secret() { const value = process.env.AUTH_SECRET; return value && value.length >= 32 && !/replace|change-me|your-secret/i.test(value) ? value : null; }
function invalidBody() { return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 }); }
function cookie(token: string) { return COOKIE + "=" + token + "; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200" + (process.env.NODE_ENV === "production" ? "; Secure" : ""); }
function issueSession(user: { id: string; email: string; name: string | null }, status = 200) {
  const key = secret(); if (!key) return null;
  const token = jwt.sign({ sub: user.id }, key, { expiresIn: "12h", issuer: "configflow-generated" });
  return NextResponse.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name } } }, { status, headers: { "Set-Cookie": cookie(token) } });
}

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action === "logout") return NextResponse.json({ success: true }, { headers: { "Set-Cookie": COOKIE + "=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" + (process.env.NODE_ENV === "production" ? "; Secure" : "") } });
  if (action !== "login" && action !== "register") return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (!secret()) return NextResponse.json({ success: false, error: "Authentication is not configured" }, { status: 503 });
  let body: any; try { body = await request.json(); } catch { return invalidBody(); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalidBody();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : null;
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) {
    return NextResponse.json({ success: false, error: "Enter a valid email and a password between 12 and 128 characters" }, { status: 400 });
  }
  try {
    if (action === "register") {
      const user = await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), name }, select: { id: true, email: true, name: true } });
      return issueSession(user, 201) || NextResponse.json({ success: false, error: "Authentication is not configured" }, { status: 503 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    return issueSession({ id: user.id, email: user.email, name: user.name }) || NextResponse.json({ success: false, error: "Authentication is not configured" }, { status: 503 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    console.error("[Generated auth] Request failed", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}`;
}

function generateAuthPage(config: AppConfig): string {
  const authEnabled = Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped);
  if (authEnabled) return generateSupportedAuthPage(config);
  return `import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function AuthPage() {
  return <main className="min-h-screen grid place-items-center bg-slate-950 p-6 text-white"><section className="max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-emerald-400" /><h1 className="mt-4 text-3xl font-bold">Authentication is disabled</h1><p className="mt-3 text-slate-300">This generated project is public and read-only. Entity reads are exposed only when the entity explicitly enables publicAccess.</p><Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 font-semibold">Continue to app<ArrowRight className="h-4 w-4" /></Link></section></main>;
}`;
}
function generateApiAuth(config: AppConfig): string {
  const needsAuth = Boolean(config.app.auth?.enabled) || Object.values(config.entities).some((entity) => entity.userScoped);
  return `import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export type ApiActor = { userId: string | null; response?: NextResponse };
export async function getApiActor(request: Request, required: boolean): Promise<ApiActor> {
  if (!required) return { userId: null };
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return { userId: null, response: NextResponse.json({ success: false, error: "Authentication is not configured" }, { status: 503 }) };
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("configflow_session="))?.slice("configflow_session=".length);
  if (!token) return { userId: null, response: NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 }) };
  try {
    const payload = jwt.verify(token, secret, { issuer: "configflow-generated" }) as jwt.JwtPayload;
    if (typeof payload.sub !== "string") throw new Error("Invalid session");
    return { userId: payload.sub };
  } catch {
    return { userId: null, response: NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 }) };
  }
}
`;
}

function generateApiValidation(): string {
  return `export type FieldRule = { type: string; required?: boolean; options?: string[]; min?: number; max?: number; pattern?: string; default?: unknown };
export type ValidationResult = { data?: Record<string, unknown>; errors?: Record<string, string> };

export function validatePayload(raw: unknown, rules: Record<string, FieldRule>, partial = false): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { errors: { body: "Expected a JSON object" } };
  const input = raw as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};
  for (const key of Object.keys(input)) if (!(key in rules)) errors[key] = "Unknown field";
  for (const [name, rule] of Object.entries(rules)) {
    let value = input[name];
    if (value === undefined && !partial && rule.default !== undefined) value = rule.default;
    if (value === undefined || value === null || value === "") {
      if (!partial && rule.required) errors[name] = "This field is required";
      continue;
    }
    if (typeof value === "string" && value.length > 10000) { errors[name] = "Value is too long"; continue; }
    if (["string", "text", "email", "url", "enum", "relation"].includes(rule.type)) {
      if (typeof value !== "string") { errors[name] = "Expected a string"; continue; }
      if (rule.type === "email" && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) errors[name] = "Enter a valid email";
      if (rule.type === "url") { try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { errors[name] = "Enter a valid HTTP or HTTPS URL"; } }
      if (rule.type === "enum" && !rule.options?.includes(value)) errors[name] = "Choose a valid option";
      if (rule.pattern) { try { if (!new RegExp(rule.pattern).test(value)) errors[name] = "Value does not match the required pattern"; } catch { errors[name] = "Field validation is misconfigured"; } }
      data[name] = value;
    } else if (rule.type === "number") {
      const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
      if (!Number.isFinite(number)) errors[name] = "Expected a finite number";
      else if (rule.min !== undefined && number < rule.min) errors[name] = "Value is below the minimum";
      else if (rule.max !== undefined && number > rule.max) errors[name] = "Value exceeds the maximum";
      else data[name] = number;
    } else if (rule.type === "boolean") {
      if (value === true || value === "true") data[name] = true;
      else if (value === false || value === "false") data[name] = false;
      else errors[name] = "Expected true or false";
    } else if (rule.type === "date" || rule.type === "datetime") {
      const date = value instanceof Date ? value : typeof value === "string" ? new Date(value) : new Date(NaN);
      if (Number.isNaN(date.getTime())) errors[name] = "Expected a valid date";
      else data[name] = date;
    } else errors[name] = "Unsupported field type";
  }
  return Object.keys(errors).length ? { errors } : { data };
}
`;
}

function generateApiRoute(entityName: string, entityConfig: EntityConfig, config: AppConfig): string {
  const model = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const rules = JSON.stringify(entityConfig.fields);
  const authRequired = Boolean(config.app.auth?.enabled) || Boolean(entityConfig.userScoped);
  const publicRead = !config.app.auth?.enabled && !entityConfig.userScoped && entityConfig.publicAccess === true;
  return `import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiActor } from "@/lib/api-auth";
import { validatePayload, FieldRule } from "@/lib/api-validation";
const rules = ${rules} as Record<string, FieldRule>;
const scoped = ${JSON.stringify(Boolean(entityConfig.userScoped))};
const authRequired = ${JSON.stringify(authRequired)};
const publicRead = ${JSON.stringify(publicRead)};
const model = prisma.${model};
function bad(errors: Record<string, string>) { return NextResponse.json({ success: false, error: "Validation failed", errors }, { status: 400 }); }
function internal() { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }
function scope(userId: string | null) { return scoped ? { userId: userId || "" } : {}; }

export async function GET(request: Request) {
  const actor = await getApiActor(request, authRequired);
  if (actor.response) return actor.response;
  if (!publicRead && !authRequired) return NextResponse.json({ success: false, error: "Public read access is disabled" }, { status: 403 });
  try {
    const records = await model.findMany({ where: scope(actor.userId), orderBy: { createdAt: "desc" } } as any);
    return NextResponse.json({ success: true, data: records });
  } catch (error) { console.error("[Generated API] List failed", error); return internal(); }
}

export async function POST(request: Request) {
  if (!${JSON.stringify(authRequired)}) return NextResponse.json({ success: false, error: "Writes require configured authentication" }, { status: 403 });
  const actor = await getApiActor(request, true);
  if (actor.response) return actor.response;
  let body: unknown; try { body = await request.json(); } catch { return bad({ body: "Malformed JSON" }); }
  const validated = validatePayload(body, rules);
  if (!validated.data) return bad(validated.errors || {});
  try {
    const record = await model.create({ data: { ...validated.data, ...(scoped ? { userId: actor.userId } : {}) } as any });
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) { console.error("[Generated API] Create failed", error); return internal(); }
}`;
}

function generateApiIdRoute(entityName: string, entityConfig: EntityConfig, config: AppConfig): string {
  const model = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const rules = JSON.stringify(entityConfig.fields);
  const authRequired = Boolean(config.app.auth?.enabled) || Boolean(entityConfig.userScoped);
  const publicRead = !config.app.auth?.enabled && !entityConfig.userScoped && entityConfig.publicAccess === true;
  const scope = entityConfig.userScoped ? `, userId: actor.userId || ""` : "";
  return `import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getApiActor } from "@/lib/api-auth";
import { validatePayload, FieldRule } from "@/lib/api-validation";
const rules = ${rules} as Record<string, FieldRule>;
const model = prisma.${model};
const authRequired = ${JSON.stringify(authRequired)};
const publicRead = ${JSON.stringify(publicRead)};
const scoped = ${JSON.stringify(Boolean(entityConfig.userScoped))};
function notFound() { return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 }); }
function bad(errors: Record<string, string>) { return NextResponse.json({ success: false, error: "Validation failed", errors }, { status: 400 }); }
function internal() { return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }); }

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(request, authRequired); if (actor.response) return actor.response;
  if (!publicRead && !authRequired) return NextResponse.json({ success: false, error: "Public read access is disabled" }, { status: 403 });
  const { id } = await context.params;
  try { const record = await model.findFirst({ where: { id${scope} } } as any); return record ? NextResponse.json({ success: true, data: record }) : notFound(); }
  catch (error) { console.error("[Generated API] Get failed", error); return internal(); }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!${JSON.stringify(authRequired)}) return NextResponse.json({ success: false, error: "Writes require configured authentication" }, { status: 403 });
  const actor = await getApiActor(request, true); if (actor.response) return actor.response;
  const { id } = await context.params; let body: unknown; try { body = await request.json(); } catch { return bad({ body: "Malformed JSON" }); }
  const validated = validatePayload(body, rules, true); if (!validated.data) return bad(validated.errors || {});
  if (!Object.keys(validated.data).length) return bad({ body: "At least one field is required" });
  try {
    const result = await model.updateMany({ where: { id${scope} }, data: validated.data as any } as any);
    if (result.count !== 1) return notFound();
    const record = await model.findFirst({ where: { id${scope} } } as any);
    return record ? NextResponse.json({ success: true, data: record }) : notFound();
  } catch (error) { console.error("[Generated API] Update failed", error); return internal(); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!${JSON.stringify(authRequired)}) return NextResponse.json({ success: false, error: "Writes require configured authentication" }, { status: 403 });
  const actor = await getApiActor(request, true); if (actor.response) return actor.response;
  const { id } = await context.params;
  try { const result = await model.deleteMany({ where: { id${scope} } } as any); if (result.count !== 1) return notFound(); return NextResponse.json({ success: true, data: { message: "Record deleted" } }); }
  catch (error) { console.error("[Generated API] Delete failed", error); return internal(); }
}`;
}

function generateEntityPage(pageName: string, entityName: string): string {
  return `"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, MoreHorizontal } from "lucide-react";

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/${entityName}")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    if (!query) return data;
    const search = query.toLowerCase();
    return data.filter((row: any) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(search))
    );
  }, [data, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">${pageName}</p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-4xl">${pageName}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search records"
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading data...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No records found.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    {Object.keys(filteredData[0]).filter(k => k !== 'id').map(key => (
                      <th key={key} className="p-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{key}</th>
                    ))}
                    <th className="p-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"><MoreHorizontal className="h-4 w-4" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.map((row: any) => (
                    <tr key={row.id} className="transition hover:bg-white/[0.03]">
                      {Object.keys(row).filter(k => k !== 'id').map(key => (
                        <td key={key} className="p-4 text-sm text-slate-300">{String(row[key])}</td>
                      ))}
                      <td className="p-4 text-slate-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredData.map((row: any) => (
                <article key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  {Object.keys(row).filter(k => k !== 'id').map(key => (
                    <div key={key} className="mb-3 last:mb-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{key}</div>
                      <div className="mt-1 break-words text-sm text-slate-200">{String(row[key])}</div>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}`;
}

function generateDashboardPage(page: Extract<AppConfig["pages"][number], { type: "dashboard" }>): string {
  const widgetsList = page.widgets || [];
  const widgets = JSON.stringify(widgetsList, null, 2);

  return `"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const widgets = ${widgets};

export default function Page() {
  const [widgetState, setWidgetState] = useState<Record<string, { loading: boolean; value?: number; groups?: Array<{ key: string; value: number }>; records?: Array<any> }>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadWidgets() {
      const entries = await Promise.all(widgets.map(async (widget: any) => {
        try {
          const res = await fetch("/api/" + widget.entity);
          const json = await res.json();
          const list = json?.success && Array.isArray(json.data) ? json.data : [];

          if (widget.type === "stat") {
            let val = list.length;
            if (widget.operation === "sum" && widget.field) {
              val = list.reduce((acc: number, r: any) => acc + (Number(r[widget.field]) || 0), 0);
            } else if (widget.operation === "avg" && widget.field) {
              val = list.length ? Math.round(list.reduce((acc: number, r: any) => acc + (Number(r[widget.field]) || 0), 0) / list.length) : 0;
            }
            return [widget.label, { loading: false, value: val }];
          }

          if (widget.type === "list") {
            return [widget.label, { loading: false, records: list.slice(0, widget.limit || 5) }];
          }

          if (widget.type === "chart") {
            const values: Record<string, number[]> = {};
            for (const r of list) {
              const k = String(r[widget.groupBy || "status"] || "Other");
              const n = widget.operation === "sum" || widget.operation === "avg" ? Number(r[widget.field]) : 1;
              if (!Number.isFinite(n)) continue;
              (values[k] ||= []).push(n);
            }
            const groups = Object.entries(values).map(([key, group]) => ({ key, value: widget.operation === "avg" ? group.reduce((a: number, b: number) => a + b, 0) / group.length : group.reduce((a: number, b: number) => a + b, 0) }));
            return [widget.label, { loading: false, value: list.length, groups }];
          }

          return [widget.label, { loading: false }];
        } catch {
          return [widget.label, { loading: false, value: 0, records: [], groups: [] }];
        }
      }));

      if (!cancelled) {
        setWidgetState(Object.fromEntries(entries));
      }
    }

    loadWidgets();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">${page.name}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">${page.name}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">Dashboard generated from your JSON widget configuration.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${widgetsList.length === 0 ? `<div className=\"rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-400\">No dashboard widgets configured.</div>` : widgetsList.map((widget) => {
          if (widget.type === "stat") {
            return `<div className=\"rounded-2xl border border-white/10 bg-slate-950/60 p-5\"><p className=\"text-sm text-slate-400\">${widget.label}</p><p className=\"mt-2 text-2xl font-bold text-white\">{widgetState[\"${widget.label}\"]?.loading ? <Loader2 className=\"h-5 w-5 animate-spin text-indigo-400\" /> : (widgetState[\"${widget.label}\"]?.value ?? 0).toLocaleString()}</p></div>`;
          }
          if (widget.type === "list") {
            return `<div className=\"rounded-2xl border border-white/10 bg-slate-950/60 p-5\"><p className=\"text-sm font-medium text-white/70\">${widget.label}</p><div className=\"mt-4 space-y-2\">{(widgetState[\"${widget.label}\"]?.records || []).map((record: any) => <div key={record.id} className=\"rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200\">{String(record.title || record.name || record.label || Object.values(record)[1] || "Item")}</div>)}</div></div>`;
          }
          const chartState = `widgetState["${widget.label}"]?.groups || []`;
          const chartBody = widget.chartType === "pie"
            ? `<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={${chartState}} dataKey="value" nameKey="key" cx="50%" cy="50%" outerRadius={85} label>{(${chartState}).map((entry: any, index: number) => <Cell key={entry.key} fill={["#818cf8", "#34d399", "#fbbf24", "#fb7185", "#38bdf8", "#c084fc"][index % 6]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>`
            : widget.chartType === "line"
              ? `<ResponsiveContainer width="100%" height="100%"><LineChart data={${chartState}}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="key" stroke="#94a3b8" /><YAxis stroke="#94a3b8" allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} /></LineChart></ResponsiveContainer>`
              : `<ResponsiveContainer width="100%" height="100%"><BarChart data={${chartState}}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="key" stroke="#94a3b8" /><YAxis stroke="#94a3b8" allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#818cf8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>`;
          return `<div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5"><p className="text-sm font-medium text-white/70">${widget.label}</p><div className="mt-4 h-64 w-full">{widgetState["${widget.label}"]?.loading ? <Loader2 className="h-5 w-5 animate-spin text-indigo-400" /> : (${chartState}).length ? ${chartBody} : <p className="pt-20 text-center text-sm text-slate-400">No chart data available</p>}</div></div>`;
        }).join("\n        ")}
      </div>
    </div>
  );
}`;
}

function generateDetailPage(page: Extract<AppConfig["pages"][number], { type: "detail" }>): string {
  const fields = page.fields && page.fields.length > 0 ? JSON.stringify(page.fields) : "null";

  return `"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const searchParams = useSearchParams();
  const recordId = (params?.id as string) || searchParams?.get("id") || "";
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      return;
    }
    fetch("/api/${page.entity}/" + recordId)
      .then((response) => response.json())
      .then((json) => {
        if (json.success) setRecord(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [recordId]);

  const visibleFields = ${fields} ?? Object.keys(record || {});

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300/70">${page.name}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">${page.name}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">Record details generated from the JSON config.</p>
      </section>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-soft md:p-6">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading record...</div>
        ) : !record ? (
          <div className="p-8 text-center text-slate-400">No record found.</div>
        ) : (
          <dl className="grid gap-4 md:grid-cols-2">
            {visibleFields.map((field: string) => (
              <div key={field} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{field}</dt>
                <dd className="mt-2 break-words text-sm text-slate-200">{String(record[field] ?? "—")}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}`;
}
