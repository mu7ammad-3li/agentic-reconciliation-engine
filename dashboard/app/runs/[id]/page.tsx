"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Copy, CheckSquare, Square } from "lucide-react";
import Link from "next/link";

export default function RunDetailPage() {
  const params = useParams();
  const id = params?.id;
  
  const [data, setData] = useState<{ run: any; items: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/runs/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading Account Details...</div>;
  if (!data || !data.run) return <div className="text-center py-20 text-red-500">Run not found</div>;

  return (
    <div className="animate-fade-in text-gray-800">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium mb-6">
        <ArrowLeft className="w-4 h-4" /> Account Register
      </Link>
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div className="flex items-baseline gap-6">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Reconcile</h1>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">General Ledger Account</p>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">1030 Checking - Operating</span>
              <div className="flex items-center gap-1 text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-sm font-medium">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span> •••6509
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-end gap-6">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Reconcile period</p>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 cursor-pointer">
              {new Date(data.run.period_start).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} 
              <span className="text-gray-400">→</span> 
              {new Date(data.run.period_end).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-l-md transition-colors shadow-sm">
              Finish Now
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-2 border-l border-orange-600 rounded-r-md transition-colors shadow-sm">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="enterprise-card p-6 flex flex-col justify-between h-32">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Cleared Balance</h3>
          <div className="flex justify-between items-center text-sm">
            <div>
              <div className="text-xl font-bold text-gray-800">$25,000.00</div>
              <div className="text-gray-400 text-xs">Beginning Balance</div>
            </div>
            <div className="text-gray-300">-</div>
            <div>
              <div className="text-xl font-bold text-gray-800">$46,845.00</div>
              <div className="text-gray-400 text-xs">3 Payments</div>
            </div>
            <div className="text-gray-300">+</div>
            <div>
              <div className="text-xl font-bold text-gray-800">$42,980.00</div>
              <div className="text-gray-400 text-xs">5 Deposits</div>
            </div>
          </div>
        </div>
        
        <div className="enterprise-card p-6 flex flex-col justify-between h-32">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reconcile</h3>
          <div className="flex justify-between items-center text-sm">
            <div>
              <div className="text-xl font-bold text-gray-800">$21,135.00</div>
              <div className="text-gray-400 text-xs">Statement Ending Balance</div>
            </div>
            <div className="text-gray-300">-</div>
            <div>
              <div className="text-xl font-bold text-gray-800">$21,135.00</div>
              <div className="text-gray-400 text-xs">Cleared Balance</div>
            </div>
            <div className="text-gray-300">=</div>
            <div>
              <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                $0 <Check className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-gray-400 text-xs">Difference</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="enterprise-card overflow-visible">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Payments</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Deposits</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 relative">
            {data.items.map((item, i) => {
              // We'll highlight the first "matched" or "partial" item as the elevated row to match the screenshot
              const isElevated = i === 1 && (item.match_status === 'matched' || item.match_status === 'partial');
              const trClasses = isElevated 
                ? "elevated-row" 
                : "hover:bg-gray-50 transition-colors";
                
              const amount = item.bank_amount ? item.bank_amount / 100 : 0;
              const isPayment = amount < 0;
              const isDeposit = amount > 0;
              
              const formattedDate = new Date(item.bank_date || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const displayId = item.ledger_transaction_id ? `GL-${item.ledger_transaction_id.substring(0,8).toUpperCase()}` : `EXT-${item.id.substring(0,8).toUpperCase()}`;

              return (
                <tr key={item.id} className={trClasses}>
                  <td className="px-6 py-5 whitespace-nowrap text-gray-600">{formattedDate}</td>
                  <td className="px-6 py-5 font-medium text-gray-800">{displayId}</td>
                  <td className="px-6 py-5 text-gray-600 truncate max-w-[150px]">
                    {item.bank_reference || "Corporate Client"}
                  </td>
                  <td className="px-6 py-5">
                    {isElevated ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Copy className="w-3.5 h-3.5 text-gray-400" /> Added or Matched Entry
                        </div>
                        <div className="text-gray-500 text-xs mt-1">This entry was Added or<br/>Matched from Bank Feeds</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600">
                        {item.bank_description || "Reconciliation Entry"}
                        {(item.match_status === 'matched' || item.match_status === 'partial') && !isElevated && (
                          <Copy className="w-3.5 h-3.5 text-blue-500 opacity-50 hover:opacity-100 cursor-pointer" />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right text-gray-600 font-medium">
                    {isPayment ? Math.abs(amount).toLocaleString('en-US', {minimumFractionDigits: 2}) : ""}
                  </td>
                  <td className="px-6 py-5 text-right text-gray-600 font-medium">
                    {isDeposit ? amount.toLocaleString('en-US', {minimumFractionDigits: 2}) : ""}
                  </td>
                  <td className="px-6 py-5 text-center flex justify-center items-center h-full">
                    {item.match_status === 'matched' || item.match_status === 'partial' ? (
                      <CheckSquare className="w-5 h-5 text-blue-600 cursor-pointer" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 cursor-pointer hover:text-gray-400" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
