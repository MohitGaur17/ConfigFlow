"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import Link from "next/link";

export default function BuilderPage() {
  const [selectedMode, setSelectedMode] = useState<"manual" | null>("manual");
  
  // Dummy Placeholder JSON
  // Dummy Placeholder JSON
  const [jsonConfig, setJsonConfig] = useState(
`{
  // Remove this and write your own JSON config
  "project": {
    "name": "ARCHITECT_OS_CORE",
    "version": "1.0.4-stable",
    "active_environment": "production"
  },
  "configuration": {
    "features": {
      "enable_telemetry": false,
      "max_concurrent_builds": 4,
      "experimental_rendering": true
    },
    "modules": [
      {
        "id": "mod_ui_core",
        "path": "/src/core/ui",
        "lazy_load": false
      },
      {
        "id": "mod_data_pipeline",
        "path": "/src/pipelines/data",
        "lazy_load": true
      }
    ]
  },
  "deployment": {
    "targets": ["aws_us_east_1", "aws_eu_central_1"],
    "auto_scaling": true,
    "min_instances": 2,
    "max_instances": 10
  }
}`
  );

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      
      {/* Page Header */}
      <div className="mb-8 border-b border-outline-hairline pb-6">
        <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Create New Project</h1>
        <p className="text-body-md text-on-surface-variant">Choose how you want to define your application architecture.</p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Manual JSON Mode */}
        <button 
          onClick={() => setSelectedMode("manual")}
          className={`flex flex-col items-start text-left p-6 rounded-xl border transition-all duration-200 ${
            selectedMode === "manual" 
              ? "bg-primary-container/10 border-primary-container shadow-[0_0_20px_rgba(255,107,0,0.15)]" 
              : "bg-surface-elevated border-outline-hairline hover:border-outline-variant"
          }`}
        >
          <span className="material-symbols-outlined text-3xl mb-4 text-primary-container">data_object</span>
          <h3 className="text-headline-md font-headline-md text-on-surface mb-2">JSON Configuration</h3>
          <p className="text-sm font-body-md text-on-surface-variant leading-relaxed">
            Manually define your strict architecture schema, endpoints, and UI components using our standard format.
          </p>
        </button>

        {/* AI Assisted Mode (Disabled) */}
        <div className="flex flex-col items-start text-left p-6 rounded-xl border border-outline-hairline bg-surface-elevated opacity-50 cursor-not-allowed relative overflow-hidden">
          <div className="absolute top-4 right-4 px-2 py-1 rounded bg-tertiary/20 border border-tertiary/30 font-label-caps text-[10px] text-tertiary tracking-widest">
            COMING SOON
          </div>
          <span className="material-symbols-outlined text-3xl mb-4 text-on-surface-variant">auto_awesome</span>
          <h3 className="text-headline-md font-headline-md text-on-surface mb-2">AI Assisted</h3>
          <p className="text-sm font-body-md text-on-surface-variant leading-relaxed">
            Describe your application in plain English and let Architect OS generate the underlying schema for you.
          </p>
        </div>

      </div>

      {/* JSON Editor Area (Only shows if Manual is selected) */}
      {selectedMode === "manual" && (
        <div className="glass-panel border border-outline-hairline rounded-xl overflow-hidden flex flex-col shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Editor Header */}
          <div className="bg-surface-container-lowest border-b border-outline-hairline px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-container">code</span>
              <span className="font-label-tech text-label-tech text-on-surface">config.json</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={() => setJsonConfig("")} className="px-4 py-1.5 rounded font-label-tech text-label-tech text-on-surface-variant hover:text-on-surface transition-colors">
                Clear
              </button>
              <button 
                onClick={async () => {
                  try {
                    const parsed = JSON.parse(jsonConfig);
                    await api.post("/apps", parsed).then(async (res) => {
                      if (!res.data.success) throw new Error(res.data.error);
                      toast.success("App Generated successfully!");
                      window.location.href = `/builder/${res.data.data.id}`;
                    });
                  } catch (e: any) {
                    alert("Failed to parse or submit JSON: " + (e.response?.data?.error || e.message));
                  }
                }}
                className="bg-primary-container hover:bg-orange-600 text-white px-5 py-1.5 rounded font-label-tech text-label-tech transition-colors shadow-[0_0_10px_rgba(255,107,0,0.3)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                Generate App
              </button>
            </div>
          </div>
          
          {/* The Textarea */}
          <div className="p-4 bg-terminal-bg">
            <textarea
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              className="w-full h-[400px] bg-transparent text-primary font-code-base text-sm resize-none outline-none border-none focus:ring-0 leading-relaxed"
              spellCheck="false"
              placeholder="Paste your JSON configuration here..."
            />
          </div>
          
        </div>
      )}

    </div>
  );
}