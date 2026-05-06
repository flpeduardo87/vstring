import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceFormProps {
  customers: any[];
  inventory: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  onScannerOpen: (target: 'mains' | 'crosses' | 'extra') => void;
}

export function ServiceForm({ customers, inventory, onSubmit, onCancel, initialData, onScannerOpen }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    customerId: initialData?.customer_id || '',
    racketModel: initialData?.racket_model || '',
    stringPattern: initialData?.string_pattern || '16x19',
    mainsId: initialData?.mains_id || '',
    mainsDescription: initialData?.mains_description || '',
    mainsTension: initialData?.mains_tension?.toString() || '',
    crossesId: initialData?.crosses_id || '',
    crossesDescription: initialData?.crosses_description || '',
    crossesTension: initialData?.crosses_tension?.toString() || '',
    preStretch: initialData?.pre_stretch?.toString() || '0',
    knots: initialData?.knots || '4 nós',
    laborPrice: initialData?.labor_price?.toString() || '55',
    price: initialData?.price?.toString() || '',
    status: initialData?.status || 'pendente',
    paymentStatus: initialData?.payment_status || 'pendente',
    paymentMethod: initialData?.payment_method || 'Pix',
    extraProducts: initialData?.extra_products || [] as any[]
  });

  // Re-calculate price whenever inputs change
  useEffect(() => {
    const labor = Number(formData.laborPrice) || 0;
    let totalStringPrice = 0;

    if (formData.mainsId && formData.mainsId !== 'manual') {
      const mainString = inventory.find(i => i.id === formData.mainsId);
      if (mainString) {
        const isHybrid = formData.mainsId !== formData.crossesId;
        const margin = Number(mainString.margin || 110);
        const sellPrice = (Number(mainString.price) || 0) * (1 + margin / 100);
        
        let stringCost = 0;
        if (mainString.type === 'rolo') {
          stringCost = isHybrid ? (sellPrice / 32) : (sellPrice / 16);
        } else {
          stringCost = isHybrid ? (sellPrice / 2) : sellPrice;
        }
        totalStringPrice += stringCost;
      }
    }

    if (formData.crossesId && formData.crossesId !== formData.mainsId && formData.crossesId !== 'manual') {
      const crossString = inventory.find(i => i.id === formData.crossesId);
      if (crossString) {
        const margin = Number(crossString.margin || 110);
        const sellPrice = (Number(crossString.price) || 0) * (1 + margin / 100);
        
        let stringCost = 0;
        if (crossString.type === 'rolo') {
          stringCost = sellPrice / 32;
        } else {
          stringCost = sellPrice / 2;
        }
        totalStringPrice += stringCost;
      }
    }

    const extraProductsPrice = (formData.extraProducts || []).reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const finalPrice = labor + totalStringPrice + extraProductsPrice;
    setFormData(prev => ({ ...prev, price: finalPrice.toFixed(2) }));
  }, [formData.laborPrice, formData.mainsId, formData.crossesId, formData.extraProducts, inventory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) {
      toast.error('Selecione um cliente');
      return;
    }
    
    onSubmit({
      ...formData,
      customer_name: customer.name,
      price: Number(formData.price)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={formData.customerId} onValueChange={v => {
            const customer = customers.find(c => c.id === v);
            if (customer) {
              setFormData({
                ...formData, 
                customerId: v,
                racketModel: `${customer.racket_brand || ''} ${customer.racket_model || ''}`.trim(),
                stringPattern: customer.string_pattern || formData.stringPattern
              });
            } else {
              setFormData({...formData, customerId: v});
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Modelo da Raquete</Label>
          <Input value={formData.racketModel} onChange={e => setFormData({...formData, racketModel: e.target.value})} placeholder="Ex: Ezone 100" required />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 text-blue-700">Cordas - Mains (Vertical)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Selecionar do Estoque</Label>
            <div className="flex gap-2">
              <Select value={formData.mainsId} onValueChange={id => {
                const item = inventory.find(i => i.id === id);
                if (item) {
                  setFormData({...formData, mainsId: id, mainsDescription: item.description});
                }
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Escolha uma corda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Entrada Manual</SelectItem>
                  {inventory.filter(i => i.category === 'Corda').map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.description} ({item.quantity}{item.type === 'rolo' ? 'm' : 'un'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => onScannerOpen('mains')}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tensão (lbs)</Label>
            <Input type="number" placeholder="Ex: 52" value={formData.mainsTension} onChange={e => setFormData({...formData, mainsTension: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <Input placeholder="Descrição da Corda" value={formData.mainsDescription} onChange={e => setFormData({...formData, mainsDescription: e.target.value})} disabled={formData.mainsId !== 'manual' && !!formData.mainsId} />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 text-blue-700">Cordas - Crosses (Horizontal)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Selecionar do Estoque</Label>
            <div className="flex gap-2">
              <Select value={formData.crossesId} onValueChange={id => {
                const item = inventory.find(i => i.id === id);
                if (item) {
                  setFormData({...formData, crossesId: id, crossesDescription: item.description});
                }
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Escolha uma corda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Entrada Manual</SelectItem>
                  {inventory.filter(i => i.category === 'Corda').map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.description} ({item.quantity}{item.type === 'rolo' ? 'm' : 'un'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => onScannerOpen('crosses')}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tensão (lbs)</Label>
            <Input type="number" placeholder="Ex: 50" value={formData.crossesTension} onChange={e => setFormData({...formData, crossesTension: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <Input placeholder="Descrição da Corda" value={formData.crossesDescription} onChange={e => setFormData({...formData, crossesDescription: e.target.value})} disabled={formData.crossesId !== 'manual' && !!formData.crossesId} />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 text-blue-700">Produtos Extras (Venda)</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select onValueChange={id => {
              const item = inventory.find(i => i.id === id);
              if (item) {
                const margin = Number(item.margin || 110);
                const sellPrice = Number(item.price) * (1 + margin / 100);
                const exists = formData.extraProducts.find(p => p.productId === id);
                if (exists) {
                  setFormData({
                    ...formData,
                    extraProducts: formData.extraProducts.map(p => 
                      p.productId === id ? { ...p, quantity: p.quantity + 1 } : p
                    )
                  });
                } else {
                  setFormData({
                    ...formData,
                    extraProducts: [...formData.extraProducts, {
                      productId: id,
                      description: item.description,
                      quantity: 1,
                      price: sellPrice,
                      cost: Number(item.price)
                    }]
                  });
                }
              }
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Adicionar produto extra..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.filter(i => i.category !== 'Corda').map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.category}: {item.description} (R$ {(Number(item.price) * (1 + Number(item.margin || 110) / 100)).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={() => onScannerOpen('extra')}>
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          {formData.extraProducts.length > 0 && (
            <div className="bg-slate-50 rounded-md p-3 space-y-2 border border-slate-100">
              {formData.extraProducts.map((p, idx) => (
                <div key={p.productId || idx} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{p.description}</span>
                    <span className="text-slate-500 ml-2">x{p.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono">R$ {(p.price * p.quantity).toFixed(2)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-500"
                      onClick={() => setFormData({
                        ...formData,
                        extraProducts: formData.extraProducts.filter((_, i) => i !== idx)
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Mão de Obra (R$)</Label>
          <Input type="number" value={formData.laborPrice} onChange={e => setFormData({...formData, laborPrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Preço Final (R$)</Label>
          <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="font-bold text-blue-700 bg-blue-50" />
        </div>
        <div className="space-y-2">
          <Label>Forma de Pagamento</Label>
          <Select value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v as any})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pix">Pix</SelectItem>
              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              <SelectItem value="Cartão">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Select value={formData.paymentStatus} onValueChange={v => setFormData({...formData, paymentStatus: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar Serviço</Button>
      </div>
    </form>
  );
}
