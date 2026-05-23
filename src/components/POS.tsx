import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  User, 
  Tag,
  CreditCard,
  Wallet,
  Smartphone,
  Barcode,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeScanner } from './BarcodeScanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function POS() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão de Débito' | 'Cartão de Crédito'>('Pix');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [scannerTarget] = useState<'barcode'>('barcode');
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus barcode input on mount and after some actions
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const unsubInventory = onSnapshot(query(collection(db, 'inventory'), orderBy('description', 'asc')), (s) => {
      setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), orderBy('name', 'asc')), (s) => {
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubInventory();
      unsubCustomers();
    };
  }, []);

  const addToCart = (product: any) => {
    const margin = Number(product.margin || 110);
    const sellPrice = Number(product.price) * (1 + margin / 100);
    
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error('Quantidade máxima em estoque atingida');
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        description: product.description,
        price: sellPrice,
        cost: Number(product.price),
        quantity: 1
      }]);
    }
    toast.success(`${product.description} adicionado`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const product = inventory.find(i => i.id === productId);
        const newQty = Math.max(1, item.quantity + delta);
        if (delta > 0 && product && newQty > product.quantity) {
          toast.error('Estoque insuficiente');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleBarcodeScan = (code: string) => {
    const product = inventory.find(i => i.barcode === code);
    if (product) {
      addToCart(product);
      setSearchTerm(''); // Clear if matched
    } else {
      toast.error('Produto não encontrado');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('O carrinho está vazio');

    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      const saleData = {
        date: serverTimestamp(),
        created_at: serverTimestamp(),
        items: cart,
        total: cartTotal,
        payment_method: paymentMethod,
        customer_id: selectedCustomerId || 'venda_avulsa',
        customer_name: customer?.name || 'Venda Avulsa',
        type: 'venda_direta'
      };

      // 1. Create Sale Record
      await addDoc(collection(db, 'sales'), saleData);

      // 2. Deduct Inventory
      for (const item of cart) {
        const itemDoc = await getDoc(doc(db, 'inventory', item.productId));
        if (itemDoc.exists()) {
          const currentQty = itemDoc.data().quantity || 0;
          await updateDoc(doc(db, 'inventory', item.productId), {
            quantity: Math.max(0, currentQty - item.quantity),
            updated_at: serverTimestamp()
          });
        }
      }

      toast.success('Venda concluída com sucesso!');
      setCart([]);
      setSelectedCustomerId(null);
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar venda');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Scanning and Search Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-card/50 backdrop-blur-xl p-12 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl flex-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,255,0,0.02),transparent)] pointer-events-none" />
          
          <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white/5 shadow-2xl relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <Barcode className="h-14 w-14 text-primary relative z-10" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Checkout <span className="text-primary not-italic">VSTRING</span></h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-bold text-xs uppercase tracking-widest opacity-70">
              Escaneie o QR Code ou procure por produtos
            </p>
          </div>
          
          <div className="flex gap-4 w-full max-w-xl relative z-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                autoFocus
                ref={barcodeInputRef}
                placeholder="PROCURAR PRODUTO OU BIPAR CÓDIGO..." 
                className="pl-14 h-16 text-lg border-white/5 bg-white/5 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-foreground placeholder:text-muted-foreground/30 uppercase font-bold tracking-widest shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    const product = inventory.find(p => 
                      p.barcode === searchTerm || 
                      p.description.toLowerCase() === searchTerm.toLowerCase()
                    );
                    if (product) {
                      addToCart(product);
                      setSearchTerm('');
                      barcodeInputRef.current?.focus();
                    } else if (searchTerm.length > 2) {
                      const partial = inventory.find(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()));
                      if (partial) {
                        addToCart(partial);
                        setSearchTerm('');
                        barcodeInputRef.current?.focus();
                      } else {
                        toast.error('Produto não encontrado');
                      }
                    } else {
                      toast.error('Produto não encontrado');
                    }
                  }
                }}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-16 w-16 shrink-0 border-slate-200 shadow-sm hover:bg-slate-50 rounded-2xl border-2"
              onClick={() => setIsScannerOpen(true)}
            >
              <Camera className="h-8 w-8 text-slate-600" />
            </Button>
          </div>

          {searchTerm && (
            <div className="w-full max-w-xl bg-card border border-white/10 rounded-3xl shadow-2xl divide-y divide-white/5 overflow-hidden z-20 -mt-6 animate-in slide-in-from-top-2 duration-300">
              {inventory
                .filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 6)
                .map(product => (
                  <button
                    key={product.id}
                    className="w-full px-8 py-5 text-left hover:bg-primary/10 flex justify-between items-center transition-all group"
                    onClick={() => {
                      addToCart(product);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight text-lg">{product.description}</span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md font-bold text-muted-foreground uppercase tracking-widest">{product.category}</span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">Disponível: {product.quantity}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-foreground text-xl tracking-tighter">
                        R$ {(Number(product.price) * (1 + Number(product.margin || 110) / 100)).toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Cart Area */}
      <Card className="w-full lg:w-[450px] flex flex-col shadow-2xl border-white/5 bg-secondary/20 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Carrinho Ativo</CardTitle>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary font-black">{cart.length} ITENS</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0 min-h-[300px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-50">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <p className="font-black text-xs uppercase tracking-[0.3em]">Carrinho Vazio</p>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Aguardando seleção de produtos</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {cart.map(item => (
                <div key={item.productId} className="p-6 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold leading-tight text-foreground uppercase tracking-tight">{item.description}</span>
                      <span className="text-[10px] text-muted-foreground font-medium mt-1">
                        {item.quantity} un x R$ {item.price.toFixed(2)}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-all"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 font-black text-primary text-lg">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-2xl border border-white/5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-white/10"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-black text-foreground">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-white/10"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-8 bg-white/5 border-t border-white/5">
          <div className="w-full flex justify-between items-center bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-inner">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Checkout</span>
            <span className="text-4xl font-black text-foreground tracking-tighter">
              R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Button 
            className="w-full h-20 text-xl font-black bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_30px_rgba(217,255,0,0.2)] rounded-2xl transition-all group active:scale-95"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            FINALIZAR VENDA
            <CheckCircle className="ml-3 h-8 w-8 group-hover:scale-110 transition-transform" />
          </Button>
        </CardFooter>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <CheckCircle className="text-primary h-6 w-6" />
              </div>
              PAGAMENTO
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            <div className="space-y-3">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Atleta Beneficiário</Label>
              <Select value={selectedCustomerId || 'venda_avulsa'} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-14 text-lg bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20">
                  <SelectValue placeholder="Venda Avulsa" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-foreground">
                  <SelectItem value="venda_avulsa">CONSUMIDOR (VENDA AVULSA)</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="space-y-4">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Método de Cobrança</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'Dinheiro', icon: Wallet, color: 'hover:border-amber-500/50' },
                  { id: 'Pix', icon: Smartphone, color: 'hover:border-blue-500/50' },
                  { id: 'Cartão de Débito', icon: CreditCard, color: 'hover:border-emerald-500/50' },
                  { id: 'Cartão de Crédito', icon: CreditCard, color: 'hover:border-purple-500/50' }
                ].map((method) => (
                  <Button 
                    key={method.id}
                    type="button" 
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    className={`flex items-center justify-start h-16 px-6 gap-4 border-white/5 transition-all rounded-2xl ${
                      paymentMethod === method.id 
                        ? 'bg-primary text-primary-foreground border-none shadow-lg' 
                        : `bg-white/5 text-muted-foreground ${method.color}`
                    }`}
                    onClick={() => setPaymentMethod(method.id as any)}
                  >
                    <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span className="text-xs font-black uppercase tracking-widest">{method.id}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-1 shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -bottom-20" />
              <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] relative z-10">Valor Total Liquido</span>
              <span className="text-5xl font-black text-foreground tracking-tighter font-sans relative z-10">
                R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              className="w-full h-16 text-lg font-black bg-primary text-primary-foreground hover:brightness-110 rounded-2xl shadow-xl transition-all active:scale-95" 
              onClick={handleCheckout}
            >
              CONFIRMAR PAGAMENTO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleBarcodeScan} 
      />
    </div>
  );
}
