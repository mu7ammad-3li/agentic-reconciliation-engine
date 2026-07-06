import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Landmark, 
  CircleDollarSign, 
  Building2, 
  Users, 
  ChevronRight,
  Settings
} from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise Reconciliation",
  description: "Professional ledger to bank reconciliation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased flex h-screen overflow-hidden`}>
        
        {/* Left Sidebar - Icons Only */}
        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 shrink-0 z-20">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-8">
            <span className="font-bold text-gray-400">Æ</span>
          </div>
          
          <nav className="flex flex-col gap-6 w-full items-center">
            <a href="/" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </a>
            <a href="/transactions" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <FileText className="w-5 h-5" />
            </a>
            <a href="/discrepancies" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <BarChart3 className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Landmark className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <CircleDollarSign className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Building2 className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 text-gray-400 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Users className="w-5 h-5" />
            </a>
          </nav>
          
          <div className="mt-auto flex flex-col gap-4 items-center">
            <a href="#" className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
              <Settings className="w-5 h-5" />
            </a>
            <div className="w-8 h-8 rounded-full bg-gray-300 mt-2 overflow-hidden border border-gray-200">
              <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[#f4f7f9] p-8">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
        
      </body>
    </html>
  );
}
