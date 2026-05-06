import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  DollarSign,
  PlusCircle,
  Users,
  Package,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  setActiveTab: (tab: any, filter?: string | null) => void;
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const [services, setServices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const unsubServices = onSnapshot(collection(db, 'services'), (s) => setServices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSales = onSnapshot(collection(db, 'sales'), (s) => setSales(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubInventory = onSnapshot(collection(db, 'inventory'), (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => {
      unsubServices();
      unsubSales();
      unsubCustomers();
      unsubInventory();
    };
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthServices = services.filter(s => {
    if (!s.date) return false;
    const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const currentMonthSales = sales.filter(s => {
    if (!s.date) return false;
    const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const pendingServices = services.filter(s => s.status === 'pendente');
  const finishedServices = services.filter(s => s.status === 'finalizado');
  
  const lowStockItems = inventory.filter(item => item.quantity <= (item.low_stock_alert || 0));
  const totalInventoryValue = inventory.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0);

  const chartData = [
    { name: 'Em andamento', value: pendingServices.length, color: '#f59e0b' },
    { name: 'Finalizados', value: finishedServices.length, color: '#10b981' },
    { name: 'Vendas Diretas', value: currentMonthSales.length, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Dashboard <span className="text-primary not-italic font-bold">VSTRING</span>
          </h2>
          <p className="text-muted-foreground font-medium tracking-tight mt-1">Visão geral de performance e operações.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setActiveTab('pos')} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95">
            <ShoppingCart className="mr-2 h-4 w-4 text-primary" /> PDV / Vendas
          </Button>
          <Button onClick={() => setActiveTab('services')} className="bg-primary hover:brightness-110 text-primary-foreground h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(217,255,0,0.15)]">
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Encordoamento
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-card/50 backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground group-hover:text-primary transition-colors">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">Operações Mês</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter">
              {currentMonthServices.length + currentMonthSales.length}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">{currentMonthServices.length} encord.</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-muted-foreground text-[10px] font-bold uppercase">{currentMonthSales.length} vendas</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-white/5 bg-card/50 backdrop-blur-sm cursor-pointer group hover:border-primary/50 transition-all duration-300"
          onClick={() => setActiveTab('services', 'pendente')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground group-hover:text-primary transition-colors">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">Em Andamento</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {pendingServices.length}
            </div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-2 tracking-widest">Aguardando Finalização</p>
          </CardContent>
        </Card>

        <Card 
          className="border-white/5 bg-card/50 backdrop-blur-sm cursor-pointer group hover:border-primary/50 transition-all duration-300"
          onClick={() => setActiveTab('services', 'finalizado')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground group-hover:text-primary transition-colors">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">Finalizados</CardTitle>
            <CheckCircle2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter">{finishedServices.length}</div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-2 tracking-widest">Serviços Concluídos</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/50 backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground group-hover:text-primary transition-colors">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">Atletas</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter">{customers.length}</div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-2 tracking-widest">Base de Clientes Ativa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-white/5 bg-secondary/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estatísticas Operacionais</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#d9ff00' : index === 1 ? '#fff' : '#444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-white/5 bg-secondary/30 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ações de Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 flex-1">
            <Button variant="outline" className="w-full justify-start h-14 bg-white/5 border-white/5 hover:bg-white/10 text-foreground group transition-all" onClick={() => setActiveTab('pos')}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold uppercase tracking-widest text-xs">Nova Venda (PDV)</span>
            </Button>
            
            <Button variant="outline" className="w-full justify-start h-14 bg-white/5 border-white/5 hover:bg-white/10 text-foreground group transition-all" onClick={() => setActiveTab('customers')}>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold uppercase tracking-widest text-xs">Atletas Cadastrados</span>
            </Button>
            
            <Button variant="outline" className="w-full justify-start h-14 bg-white/5 border-white/5 hover:bg-white/10 text-foreground group transition-all" onClick={() => setActiveTab('inventory')}>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold uppercase tracking-widest text-xs">Gestão de Insumos</span>
            </Button>

            <div className="grid grid-cols-2 gap-4 mt-auto pt-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Valor Estoque</p>
                <p className="text-xl font-black text-foreground">R$ {totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${lowStockItems.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/5 border-primary/10'}`}>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 text-center">Insumos Críticos</p>
                <p className={`text-xl font-black text-center ${lowStockItems.length > 0 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
