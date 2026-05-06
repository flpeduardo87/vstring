import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, CreditCard, Wallet, Percent, PieChart as PieIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function Financial() {
  const [services, setServices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const unsubServices = onSnapshot(collection(db, 'services'), (s) => 
      setServices(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubSales = onSnapshot(collection(db, 'sales'), (s) =>
      setSales(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubInventory = onSnapshot(collection(db, 'inventory'), (s) => 
      setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubServices();
      unsubSales();
      unsubInventory();
    };
  }, []);

  const calculateServiceCost = (s: any) => {
    let cost = 0;
    
    // Mains Cost
    if (s.mains_id && s.mains_id !== 'manual') {
      const item = inventory.find(i => i.id === s.mains_id);
      if (item) {
        const isHybrid = s.mains_id !== s.crosses_id;
        const metersUsed = isHybrid ? 6 : 12;
        const totalMeters = Number(item.total_meters) || 200;
        const costPerMeter = Number(item.price) / totalMeters;
        cost += costPerMeter * metersUsed;
      }
    }

    // Crosses Cost
    if (s.crosses_id && s.crosses_id !== s.mains_id && s.crosses_id !== 'manual') {
      const item = inventory.find(i => i.id === s.crosses_id);
      if (item) {
        const metersUsed = 6;
        const totalMeters = Number(item.total_meters) || 200;
        const costPerMeter = Number(item.price) / totalMeters;
        cost += costPerMeter * metersUsed;
      }
    }

    // Extra Products Cost
    if (s.extra_products) {
      s.extra_products.forEach((p: any) => {
        const item = inventory.find(i => i.id === p.productId);
        if (item) {
          cost += Number(item.price) * p.quantity;
        }
      });
    }

    return cost;
  };

  const now = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now
  });

  const chartData = months.map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthServices = services.filter(s => {
      if (!s.date) return false;
      const isPaid = s.payment_status === 'pago';
      if (!isPaid) return false;
      const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
      return isWithinInterval(d, { start, end });
    });

    const monthSales = sales.filter(s => {
      if (!s.date) return false;
      const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
      return isWithinInterval(d, { start, end });
    });

    const serviceRevenue = monthServices.reduce((acc, s) => acc + (s.price || 0), 0);
    const saleRevenue = monthSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const revenue = serviceRevenue + saleRevenue;

    const serviceCost = monthServices.reduce((acc, s) => acc + calculateServiceCost(s), 0);
    const saleCost = monthSales.reduce((acc, s) => {
      return acc + (s.items?.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0) || 0);
    }, 0);
    const cost = serviceCost + saleCost;
    const profit = revenue - cost;

    return {
      name: format(month, 'MMM', { locale: ptBR }),
      revenue: Number(revenue.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      cost: Number(cost.toFixed(2))
    };
  });

  const currentMonthTotalServices = services.filter(s => {
    if (!s.date) return false;
    const isPaid = s.payment_status === 'pago';
    if (!isPaid) return false;
    const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
  });

  const currentMonthSales = sales.filter(s => {
    if (!s.date) return false;
    const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
  });

  const totalRevenue = currentMonthTotalServices.reduce((acc, s) => acc + (s.price || 0), 0) + 
                       currentMonthSales.reduce((acc, s) => acc + (s.total || 0), 0);
  
  const totalCost = currentMonthTotalServices.reduce((acc, s) => acc + calculateServiceCost(s), 0) +
                    currentMonthSales.reduce((acc, s) => {
                      return acc + (s.items?.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0) || 0);
                    }, 0);
  const totalProfit = totalRevenue - totalCost;

  const lastMonthTotalServices = services.filter(s => {
    if (!s.date) return false;
    const isPaid = s.payment_status === 'pago';
    if (!isPaid) return false;
    const lastMonth = subMonths(now, 1);
    const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return isWithinInterval(d, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
  });

  const lastMonthSales = sales.filter(s => {
    if (!s.date) return false;
    const lastMonth = subMonths(now, 1);
    const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return isWithinInterval(d, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
  });

  const lastMonthRevenue = lastMonthTotalServices.reduce((acc, s) => acc + (s.price || 0), 0) + 
                          lastMonthSales.reduce((acc, s) => acc + (s.total || 0), 0);

  const revenueTrend = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const combinedCurrentMonthOps = [
    ...currentMonthTotalServices.map(s => ({ ...s, amount: s.price })),
    ...currentMonthSales.map(s => ({ ...s, amount: s.total }))
  ];

  const pixRevenue = combinedCurrentMonthOps.filter(s => s.payment_method === 'Pix').reduce((acc, s) => acc + (s.amount || 0), 0);
  const cashRevenue = combinedCurrentMonthOps.filter(s => s.payment_method === 'Dinheiro').reduce((acc, s) => acc + (s.amount || 0), 0);
  const cardRevenue = combinedCurrentMonthOps.filter(s => s.payment_method === 'Cartão').reduce((acc, s) => acc + (s.amount || 0), 0);

  const paymentData = [
    { name: 'Pix', value: pixRevenue, color: '#10b981' },
    { name: 'Dinheiro', value: cashRevenue, color: '#f59e0b' },
    { name: 'Cartão', value: cardRevenue, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Financeiro Detalhado</h2>
          <p className="text-muted-foreground">Análise de lucratividade e saúde financeira.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-600">Dados em tempo real</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Receita Total (Mês)</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center mt-2">
              {revenueTrend >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs font-bold ${revenueTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {Math.abs(revenueTrend).toFixed(1)}% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="h-1 bg-emerald-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Lucro Líquido</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Margem de Lucro: <span className="text-emerald-600 font-bold">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</span></p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="h-1 bg-amber-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Custo de Materiais</CardTitle>
            <Wallet className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Representa {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : 0}% da receita</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="h-1 bg-purple-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Média por Serviço</CardTitle>
            <Percent className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">R$ {currentMonthTotalServices.length + currentMonthSales.length > 0 ? (totalRevenue / (currentMonthTotalServices.length + currentMonthSales.length)).toFixed(2) : '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{currentMonthTotalServices.length + currentMonthSales.length} operações realizadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Crescimento de Receita vs Lucro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Receita"
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    name="Lucro"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieIcon className="h-5 w-5 text-purple-600" />
              Métodos de Pagamento (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[300px] w-full">
              {paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: '600' }} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                  Nenhum dado de pagamento este mês.
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-8 w-full mt-4">
              {paymentData.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">{d.name}</p>
                  <p className="text-sm font-black" style={{ color: d.color }}>{((d.value / (totalRevenue || 1)) * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
