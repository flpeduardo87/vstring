import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrorHandler';
import { BarcodeScanner } from './BarcodeScanner';

export function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Corda',
    barcode: '',
    type: 'rolo',
    quantity: '',
    lowStockAlert: '10',
    price: '',
    margin: '110',
    sellPrice: '',
    totalMeters: '200'
  });

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('description', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        description: formData.description || '',
        category: formData.category || 'Corda',
        barcode: formData.barcode || '',
        type: formData.type || (formData.category === 'Corda' ? 'rolo' : 'unidade'),
        quantity: Number(formData.quantity) || 0,
        low_stock_alert: Number(formData.lowStockAlert) || 0,
        price: Number(formData.price) || 0,
        margin: Number(formData.margin) || 0,
        total_meters: formData.type === 'rolo' ? Number(formData.totalMeters) : null,
        updated_at: serverTimestamp()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventory', editingItem.id), data);
        toast.success('Estoque atualizado!');
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...data,
          created_at: serverTimestamp()
        });
        toast.success('Item adicionado ao estoque!');
      }

      // Explicitly close the dialog after successful save
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ 
        description: '', 
        category: 'Corda', 
        barcode: '', 
        type: 'rolo', 
        quantity: '', 
        lowStockAlert: '10', 
        price: '', 
        margin: '110',
        sellPrice: '',
        totalMeters: '200'
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar item. Verifique suas permissões.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este item do estoque?')) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        toast.success('Item removido.');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir item. Verifique suas permissões.');
      }
    }
  };

  const filteredItems = items.filter(i => 
    (i.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (i.barcode && i.barcode.includes(searchTerm))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Cadastro de Itens</h2>
          <p className="text-slate-200">Gerencie seu catálogo de cordas e produtos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={() => { 
                setEditingItem(null); 
                setFormData({ 
                  description: '', 
                  category: 'Corda', 
                  barcode: '', 
                  type: 'rolo', 
                  quantity: '', 
                  lowStockAlert: '10', 
                  price: '', 
                  margin: '110',
                  sellPrice: '',
                  totalMeters: '200'
                }); 
              }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Novo Item
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Item' : 'Adicionar ao Estoque'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Label className="text-blue-700 font-bold">O que você deseja cadastrar?</Label>
                <Select value={formData.category} onValueChange={v => {
                  const newType = v === 'Corda' ? 'rolo' : 'unidade';
                  setFormData({...formData, category: v, type: newType});
                }}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corda">Corda (Para Encordoamento)</SelectItem>
                    <SelectItem value="Produto">Produto (Para Venda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      value={formData.barcode} 
                      onChange={e => setFormData({...formData, barcode: e.target.value})} 
                      placeholder="Escaneie ou digite o código" 
                      className="pr-10"
                    />
                    <Package className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsScannerOpen(true)}
                    className="shrink-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição do Produto / Corda</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Ex: Yonex Poly Tour Pro 1.25mm ou Tubo de Bolas Wilson" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Unidade</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={v => setFormData({...formData, type: v})}
                    disabled={true} // Enforced by category
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rolo">Rolo (Metros)</SelectItem>
                      <SelectItem value="unidade">Unidade</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 italic">
                    {formData.category === 'Corda' ? 'Cordas são cadastradas em rolos.' : 'Produtos são cadastrados em unidades.'}
                  </p>
                </div>
                {formData.type === 'rolo' && (
                  <div className="space-y-2">
                    <Label>Metragem Total do Rolo (m)</Label>
                    <Input 
                      type="number" 
                      value={formData.totalMeters} 
                      onChange={e => setFormData({...formData, totalMeters: e.target.value})} 
                      placeholder="Ex: 200" 
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.category === 'Corda' && formData.type === 'rolo' 
                    ? 'Quantidade Atual (Metros)' 
                    : 'Quantidade Atual (Unidades)'}
                </Label>
                <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Alerta de Estoque Baixo (Abaixo de)</Label>
                <Input type="number" value={formData.lowStockAlert} onChange={e => setFormData({...formData, lowStockAlert: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Custo (R$)</Label>
                  <Input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => {
                      const cost = Number(e.target.value);
                      const margin = Number(formData.margin);
                      const sellPrice = cost * (1 + margin / 100);
                      setFormData({
                        ...formData, 
                        price: e.target.value,
                        sellPrice: sellPrice > 0 ? sellPrice.toFixed(2) : ''
                      });
                    }} 
                    placeholder="Ex: 50.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Margem Desejada (%)</Label>
                  <Input 
                    type="number" 
                    value={formData.margin} 
                    onChange={e => {
                      const margin = Number(e.target.value);
                      const cost = Number(formData.price);
                      const sellPrice = cost * (1 + margin / 100);
                      setFormData({
                        ...formData, 
                        margin: e.target.value,
                        sellPrice: sellPrice > 0 ? sellPrice.toFixed(2) : ''
                      });
                    }} 
                    placeholder="Ex: 110" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preço de Venda (R$)</Label>
                <Input 
                  type="number" 
                  value={formData.sellPrice} 
                  onChange={e => {
                    const finalPrice = Number(e.target.value);
                    const cost = Number(formData.price);
                    if (cost > 0 && finalPrice > 0) {
                      const newMargin = ((finalPrice / cost) - 1) * 100;
                      setFormData({
                        ...formData, 
                        sellPrice: e.target.value,
                        margin: newMargin.toFixed(0)
                      });
                    } else {
                      setFormData({...formData, sellPrice: e.target.value});
                    }
                  }}
                  placeholder="Calculado automaticamente"
                  className="font-bold text-blue-700 bg-blue-50"
                />
                <p className="text-[10px] text-slate-500 italic">Você pode digitar o preço final para calcular a margem automaticamente.</p>
              </div>
              
              {formData.price && formData.margin && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-1">
                  <div className="flex justify-between items-center text-xs text-blue-600">
                    <span>Lucro Bruto por Unidade:</span>
                    <span className="font-bold">R$ {(Number(formData.price) * (Number(formData.margin) / 100)).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingItem ? 'Salvar Alterações' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por descrição ou código de barras..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-100 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-700 text-white">
                <TableRow>
                  <TableHead className="text-white">Categoria</TableHead>
                  <TableHead className="text-white">Descrição</TableHead>
                  <TableHead className="text-white">Cód. Barras</TableHead>
                  <TableHead className="text-white">Quantidade</TableHead>
                  <TableHead className="text-white">Custo</TableHead>
                  <TableHead className="text-white">Venda</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-white">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">{item.category || 'Corda'}</Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="font-medium text-white">{item.description}</div>
                      </TableCell>
                      <TableCell className="text-xs text-white font-mono">
                        {item.barcode || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-white">
                        {item.quantity} {item.type === 'rolo' ? 'm' : 'un'}
                      </TableCell>
                      <TableCell className="text-white">
                        R$ {Number(item.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold text-white">
                        R$ {(Number(item.price || 0) * (1 + Number(item.margin || 110) / 100)).toFixed(2)}
                        <div className="text-[10px] font-normal text-white">{item.margin || 110}% margem</div>
                      </TableCell>
                      <TableCell className="text-white">
                        {item.quantity <= (item.low_stock_alert || 0) ? (
                          <Badge className="bg-red-100 text-slate-800 hover:bg-red-200 border-red-200 flex w-fit gap-1">
                            <AlertTriangle className="h-3 w-3 text-slate-800" /> Baixo
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-slate-800 hover:bg-emerald-200 border-emerald-200">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { 
                            const sellPrice = (Number(item.price || 0) * (1 + Number(item.margin || 110) / 100)).toFixed(2);
                            setEditingItem(item); 
                            setFormData({ 
                              description: item.description, 
                              category: item.category || 'Corda', 
                              barcode: item.barcode || '', 
                              type: item.type, 
                              quantity: item.quantity.toString(), 
                              lowStockAlert: (item.low_stock_alert || 10).toString(), 
                              price: (item.price || 0).toString(), 
                              margin: (item.margin || 110).toString(),
                              sellPrice: sellPrice,
                              totalMeters: (item.total_meters || 200).toString()
                            }); 
                            setIsDialogOpen(true); 
                          }}>
                            <Edit2 className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-white">
                      Nenhum item no estoque.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(code) => setFormData({...formData, barcode: code})} 
      />
    </div>
  );
}
