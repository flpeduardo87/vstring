import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeScanner } from './BarcodeScanner';

interface ServiceFormProps {
  customers: any[];
  inventory: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function ServiceForm({ customers, inventory, onSubmit, onCancel, initialData }: ServiceFormProps) {
  const [customerRackets, setCustomerRackets] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'mains' | 'crosses' | 'extra' | null>(null);

  const [formData, setFormData] = useState({
    customerId: initialData?.customer_id || '',
    racketId: initialData?.racket_id || '',
    racketBrand: initialData?.racket_brand || '',
    racketModel: initialData?.racket_model || '',
    stringPattern: initialData?.string_pattern || '16x19',
    racketObservations: initialData?.racket_observations || '',
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
    extraProducts: initialData?.extra_products || [] as any[],
    observations: initialData?.observations || ''
  });

  const handleBarcodeScan = (code: string) => {
    const item = inventory.find(i => i.barcode === code);
    if (!item) {
      toast.error('Produto não encontrado no estoque.');
      return;
    }

    if (scannerTarget === 'mains') {
      if (item.category !== 'Corda') return toast.error('Este item não é uma corda.');
      setFormData({...formData, mainsId: item.id, mainsDescription: item.description});
      toast.success(`Corda selecionada: ${item.description}`);
    } else if (scannerTarget === 'crosses') {
      if (item.category !== 'Corda') return toast.error('Este item não é uma corda.');
      setFormData({...formData, crossesId: item.id, crossesDescription: item.description});
      toast.success(`Corda selecionada: ${item.description}`);
    } else if (scannerTarget === 'extra') {
      if (item.category === 'Corda') return toast.error('Use os campos de corda para encordoamento.');
      
      const margin = Number(item.margin || 110);
      const sellPrice = Number(item.price) * (1 + margin / 100);
      const exists = formData.extraProducts.find(p => p.productId === item.id);
      
      if (exists) {
        setFormData({
          ...formData,
          extraProducts: formData.extraProducts.map(p => 
            p.productId === item.id ? { ...p, quantity: p.quantity + 1 } : p
          )
        });
      } else {
        setFormData({
          ...formData,
          extraProducts: [...formData.extraProducts, {
            productId: item.id,
            description: item.description,
            quantity: 1,
            price: sellPrice,
            cost: Number(item.price)
          }]
        });
      }
      toast.success(`Produto adicionado: ${item.description}`);
    }
  };

  const openScanner = (target: 'mains' | 'crosses' | 'extra') => {
    setScannerTarget(target);
    setIsScannerOpen(true);
  };

  useEffect(() => {
    if (formData.customerId) {
      const q = query(collection(db, 'customers', formData.customerId, 'rackets'), orderBy('brand', 'asc'));
      const fetchRackets = async () => {
        const snapshot = await getDocs(q);
        const rackets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomerRackets(rackets);
        
        // Auto-select if ONLY one racket exists and we don't have a racket selected yet
        if (rackets.length === 1) {
          const racket = rackets[0] as any;
          // Only update if it's currently empty (e.g. just selected customer)
          setFormData(prev => {
            if (prev.racketId) return prev;
            return {
              ...prev,
              racketId: racket.id,
              racketBrand: racket.brand || '',
              racketModel: racket.model || '',
              stringPattern: racket.string_pattern || '16x19',
              racketObservations: racket.observations || ''
            };
          });
        }
      };
      fetchRackets();
    } else {
      setCustomerRackets([]);
    }
  }, [formData.customerId]);

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
          // Formula: ((Price + Margin) / 200) * (6 or 12)
          stringCost = isHybrid ? (sellPrice / 200 * 6) : (sellPrice / 200 * 12);
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
          // Only half for hybrid crosses
          stringCost = sellPrice / 200 * 6;
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
    
    // Check if required fields are missing
    if (!formData.racketModel) {
      toast.error('Informe o modelo da raquete');
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
            setFormData({
              ...formData, 
              customerId: v,
              racketId: '',
              racketModel: '',
            });
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
          <Label>Escolher Raquete (Se já tiver)</Label>
          <Select value={formData.racketId} onValueChange={v => {
            if (v === 'new') {
              setFormData({...formData, racketId: 'new', racketBrand: '', racketModel: '', stringPattern: '16x19', racketObservations: ''});
            } else {
              const racket = customerRackets.find(r => r.id === v);
              if (racket) {
                setFormData({
                  ...formData, 
                  racketId: v, 
                  racketBrand: racket.brand || '',
                  racketModel: racket.model || '',
                  stringPattern: racket.string_pattern || '16x19',
                  racketObservations: racket.observations || ''
                });
              }
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a raquete" />
            </SelectTrigger>
            <SelectContent>
              {customerRackets.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.brand} {r.model} ({r.string_pattern})</SelectItem>
              ))}
              <SelectItem value="new">+ Digitar nova</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4">
        <div className="space-y-2">
          <Label>Marca</Label>
          <Input value={formData.racketBrand} onChange={e => setFormData({...formData, racketBrand: e.target.value})} placeholder="Wilson" required />
        </div>
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input value={formData.racketModel} onChange={e => setFormData({...formData, racketModel: e.target.value})} placeholder="Blade 98" required />
        </div>
        <div className="space-y-2">
          <Label>Padrão</Label>
          <Input value={formData.stringPattern} onChange={e => setFormData({...formData, stringPattern: e.target.value})} placeholder="16x19" required />
        </div>
        <div className="space-y-2">
          <Label>Obs. da Raquete</Label>
          <Input value={formData.racketObservations} onChange={e => setFormData({...formData, racketObservations: e.target.value})} placeholder="Peso extra..." />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 text-blue-700">Cordas - Mains (Vertical)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Selecionar do Estoque / Bipar Código</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Select value={formData.mainsId} onValueChange={id => {
                  const item = inventory.find(i => i.id === id);
                  if (item) {
                    setFormData({...formData, mainsId: id, mainsDescription: item.description});
                  } else if (id === 'manual') {
                    setFormData({...formData, mainsId: 'manual', mainsDescription: ''});
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma corda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Entrada Manual</SelectItem>
                    {inventory.filter(i => i.category === 'Corda').map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.description} ({item.quantity}{item.type === 'rolo' ? 'm' : 'un'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input 
                placeholder="Bipar..." 
                className="w-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const code = (e.target as HTMLInputElement).value;
                    const item = inventory.find(i => i.barcode === code && i.category === 'Corda');
                    if (item) {
                      setFormData({...formData, mainsId: item.id, mainsDescription: item.description});
                      (e.target as HTMLInputElement).value = '';
                      toast.success(`Corda selecionada: ${item.description}`);
                    } else {
                      toast.error('Corda não encontrada com este código');
                    }
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => openScanner('mains')}>
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
            <Label>Selecionar do Estoque / Bipar Código</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Select value={formData.crossesId} onValueChange={id => {
                  const item = inventory.find(i => i.id === id);
                  if (item) {
                    setFormData({...formData, crossesId: id, crossesDescription: item.description});
                  } else if (id === 'manual') {
                    setFormData({...formData, crossesId: 'manual', crossesDescription: ''});
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma corda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Entrada Manual</SelectItem>
                    {inventory.filter(i => i.category === 'Corda').map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.description} ({item.quantity}{item.type === 'rolo' ? 'm' : 'un'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input 
                placeholder="Bipar..." 
                className="w-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const code = (e.target as HTMLInputElement).value;
                    const item = inventory.find(i => i.barcode === code && i.category === 'Corda');
                    if (item) {
                      setFormData({...formData, crossesId: item.id, crossesDescription: item.description});
                      (e.target as HTMLInputElement).value = '';
                      toast.success(`Corda selecionada: ${item.description}`);
                    } else {
                      toast.error('Corda não encontrada com este código');
                    }
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => openScanner('crosses')}>
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
            <div className="relative flex-1">
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
                <SelectTrigger>
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
            </div>
            <Input 
              placeholder="Bipar..." 
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const code = (e.target as HTMLInputElement).value;
                  const item = inventory.find(i => i.barcode === code);
                  if (item) {
                    if (item.category === 'Corda') {
                      toast.error('Use os campos de corda para encordoamento');
                      return;
                    }
                    const margin = Number(item.margin || 110);
                    const sellPrice = Number(item.price) * (1 + margin / 100);
                    const exists = formData.extraProducts.find(p => p.productId === item.id);
                    
                    if (exists) {
                      setFormData({
                        ...formData,
                        extraProducts: formData.extraProducts.map(p => 
                          p.productId === item.id ? { ...p, quantity: p.quantity + 1 } : p
                        )
                      });
                    } else {
                      setFormData({
                        ...formData,
                        extraProducts: [...formData.extraProducts, {
                          productId: item.id,
                          description: item.description,
                          quantity: 1,
                          price: sellPrice,
                          cost: Number(item.price)
                        }]
                      });
                    }
                    (e.target as HTMLInputElement).value = '';
                    toast.success(`Produto adicionado: ${item.description}`);
                  } else {
                    toast.error('Produto não encontrado');
                  }
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => openScanner('extra')}>
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
          <Label>Pre-Stretch (%)</Label>
          <Select value={formData.preStretch} onValueChange={v => setFormData({...formData, preStretch: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0%</SelectItem>
              <SelectItem value="5">5%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="15">15%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nós (Padrão)</Label>
          <Select value={formData.knots} onValueChange={v => setFormData({...formData, knots: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2 nós">2 nós</SelectItem>
              <SelectItem value="4 nós">4 nós</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mão de Obra (R$)</Label>
          <Input type="number" value={formData.laborPrice} onChange={e => setFormData({...formData, laborPrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Preço Final (R$)</Label>
          <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="font-bold text-blue-700 bg-blue-50" />
        </div>
      </div>

      <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="border-t pt-4">
        <div className="space-y-2">
          <Label>Observações do Serviço</Label>
          <Input 
            placeholder="Ex: Cliente tem pressa, cuidado com a pintura..." 
            value={formData.observations} 
            onChange={e => setFormData({...formData, observations: e.target.value})} 
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Salvar Serviço</Button>
      </div>

      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleBarcodeScan} 
      />
    </form>
  );
}
