"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Check, AlertTriangle, Fingerprint, BrainCircuit, ActivitySquare } from "lucide-react";

export default function DiscrepanciesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => {
    fetch("/api/discrepancies")
      .then(res => res.json())
      .then(d => {
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFlag = async (transaction_id: string, review_status: string) => {
    if (!transaction_id) return alert("No ledger transaction ID attached.");
    
    await fetch("/api/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id, review_status, reason: "Manual UI override" })
    });
    fetchItems();
  };

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-blue-600">
      <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
      <span className="font-semibold uppercase tracking-widest text-sm">Scanning records...</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-600" /> 
            Action Required
          </h2>
          <p className="text-gray-500 mt-2 font-medium text-sm">
            AI-flagged discrepancies awaiting human review
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm font-semibold text-gray-700">{items.length} Critical Items</span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
          <Check className="w-16 h-16 mx-auto mb-6 text-green-500" />
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">System Secure</h3>
          <p className="text-gray-500 mt-2">No pending discrepancies found. Reconciliation complete.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {items.map((item) => {
            const isHighPriority = item.ai_confidence < 0.75;
            const headerBg = isHighPriority ? "bg-red-50" : "bg-amber-50";
            const borderColor = isHighPriority ? "border-red-200" : "border-amber-200";
            const iconColor = isHighPriority ? "text-red-600" : "text-amber-600";
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl flex flex-col overflow-hidden border ${borderColor} shadow-sm transition-shadow hover:shadow-md`}
              >
                {/* Top Bar */}
                <div className={`px-6 py-3 border-b ${borderColor} ${headerBg} flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <ActivitySquare className={`w-4 h-4 ${iconColor}`} />
                    <span className={`uppercase text-xs font-bold tracking-widest ${iconColor}`}>
                      {item.ai_cause ? item.ai_cause.replace('_', ' ') : 'Unknown Anomaly'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fingerprint className={`w-4 h-4 ${iconColor} opacity-70`} />
                    <span className={`text-xs font-bold ${iconColor}`}>
                      CONF: {(item.ai_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6">
                  {/* Data Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold">Ledger Entry</div>
                      <div className="font-mono text-sm text-gray-900 font-medium">
                        {item.ledger_transaction_id ? item.ledger_transaction_id.split('-')[0].toUpperCase() : 'NO_ENTRY'}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold">Bank Statement</div>
                      <div className="font-mono text-sm text-gray-900 font-medium truncate" title={item.bank_description || item.bank_reference}>
                        {item.bank_description || item.bank_reference || 'NO_ENTRY'}
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Reasoning Block */}
                  <div className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                    <div className="pl-3">
                      <h4 className="text-xs text-blue-700 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" /> 
                        Agent Reasoning
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        {item.ai_reasoning || "No reasoning generated."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-4">
                  <button 
                    onClick={() => handleFlag(item.ledger_transaction_id, 'resolved')}
                    className="flex-1 bg-white hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors py-2 rounded-md text-sm font-semibold border border-gray-300 hover:border-green-300 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Resolve
                  </button>
                  <button 
                    onClick={() => handleFlag(item.ledger_transaction_id, 'under_review')}
                    className={`flex-1 text-white py-2 rounded-md text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-colors
                      ${isHighPriority 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Escalate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
