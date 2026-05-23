/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Auth } from '@/components/Auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Logo } from '@/components/Logo';
import { 
  ShoppingCart,
  LayoutDashboard, 
  Users, 
  Wrench, 
  Package, 
  DollarSign, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/Dashboard';
import { Customers } from '@/components/Customers';
import { Services } from '@/components/Services';
import { Inventory } from '@/components/Inventory';
import { Financial } from '@/components/Financial';
import { Settings } from '@/components/Settings';
import { POS } from '@/components/POS';

type Tab = 'pos' | 'dashboard' | 'customers' | 'services' | 'inventory' | 'financial' | 'settings';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [tabFilter, setTabFilter] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const handleTabChange = (tab: Tab, filter: string | null = null) => {
    setActiveTab(tab);
    setTabFilter(filter);
    setIsMobileMenuOpen(false);
  };

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  const user = { email: 'magnumvictor@gmail.com' };
  const userMetadata = {
    full_name: 'Magnum Victor',
    email: user.email
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'PDV / Vendas', icon: ShoppingCart },
    { id: 'services', label: 'Serviços', icon: Wrench },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pos': return <POS />;
      case 'dashboard': return <Dashboard setActiveTab={handleTabChange} />;
      case 'customers': return <Customers />;
      case 'services': return <Services initialFilter={tabFilter} />;
      case 'inventory': return <Inventory />;
      case 'financial': return <Financial />;
      case 'settings': return <Settings />;
      default: return <POS />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-white/5 shadow-2xl relative z-10">
          <div className="p-8 border-b border-white/5">
            <Logo />
          </div>
          
          <nav className="flex-1 p-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(217,255,0,0.15)] scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-primary-foreground' : 'group-hover:text-primary'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="relative">
                <img 
                  src={`https://ui-avatars.com/api/?name=${userMetadata.full_name}&background=d9ff00&color=000`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-inner"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-sidebar rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate tracking-tight">{userMetadata.full_name || 'Admin VSTRING'}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-widest">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3 rounded-xl py-6"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-widest">Encerrar Sessão</span>
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-sidebar border-b border-white/5 sticky top-0 z-50">
          <Logo className="h-8 w-8" showText={false} />
          <span className="font-black tracking-tighter text-lg uppercase italic text-primary">VSTRING</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-foreground">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-background z-40 pt-20 p-6 flex flex-col animate-in fade-in slide-in-from-top duration-300">
            <nav className="flex-1 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as Tab)}
                  className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-lg transition-all ${
                    activeTab === item.id 
                      ? 'bg-primary text-primary-foreground font-black shadow-lg scale-[1.02]' 
                      : 'text-muted-foreground border border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </button>
              ))}
            </nav>
            <Button 
              variant="outline" 
              className="mt-auto py-8 text-red-400 border-red-500/20 hover:bg-red-500/10 rounded-2xl font-bold uppercase tracking-widest"
              onClick={handleLogout}
            >
              <LogOut className="mr-2" /> Sair do Painel
            </Button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto w-full relative z-10">
            {renderContent()}
          </div>
        </main>
        
        <Toaster position="bottom-right" theme="dark" closeButton />
      </div>
    </ErrorBoundary>
  );
}
