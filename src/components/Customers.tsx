import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Phone, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    racketBrand: '', 
    racketModel: '', 
    stringPattern: '',
    observations: '' 
  });

  const commonPatterns = ['16x19', '18x20', '16x18', '16x20', '14x18'];

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(docs);
    }, (error) => {
      console.error("Firestore error:", error);
      toast.error('Erro ao carregar clientes');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name || '',
        phone: formData.phone || '',
        racket_brand: formData.racketBrand || '',
        racket_model: formData.racketModel || '',
        string_pattern: formData.stringPattern || '',
        observations: formData.observations || '',
        updated_at: serverTimestamp()
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), data);
        toast.success('Cliente atualizado!');
      } else {
        await addDoc(collection(db, 'customers'), {
          ...data,
          created_at: serverTimestamp()
        });
        toast.success('Cliente cadastrado com sucesso!');
      }

      // Explicitly close the dialog after successful save
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ 
        name: '', 
        phone: '', 
        racketBrand: '', 
        racketModel: '', 
        stringPattern: '',
        observations: '' 
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar cliente. Verifique suas permissões.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        toast.success('Cliente excluído.');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir cliente. Verifique suas permissões.');
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm)
  );

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-sidebar/50 p-6 rounded-xl border border-white/5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h2>
          <p className="text-muted-foreground">Gerencie sua base de clientes e histórico.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={() => { 
                setEditingCustomer(null); 
                setFormData({ 
                  name: '', 
                  phone: '', 
                  racketBrand: '', 
                  racketModel: '', 
                  stringPattern: '',
                  observations: '' 
                }); 
              }} className="bg-primary hover:bg-primary/80 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  required 
                  placeholder="Ex: 11999999999"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="racketBrand">Marca da Raquete</Label>
                  <Input 
                    id="racketBrand" 
                    value={formData.racketBrand} 
                    onChange={e => setFormData({...formData, racketBrand: e.target.value})} 
                    placeholder="Ex: Yonex"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="racketModel">Modelo da Raquete</Label>
                  <Input 
                    id="racketModel" 
                    value={formData.racketModel} 
                    onChange={e => setFormData({...formData, racketModel: e.target.value})} 
                    placeholder="Ex: Ezone 100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stringPattern">Padrão de Encordoamento</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {commonPatterns.map(pattern => (
                    <Button 
                      key={pattern}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-7 px-2"
                      onClick={() => setFormData({...formData, stringPattern: pattern})}
                    >
                      {pattern}
                    </Button>
                  ))}
                </div>
                <Input 
                  id="stringPattern" 
                  value={formData.stringPattern} 
                  onChange={e => setFormData({...formData, stringPattern: e.target.value})} 
                  placeholder="Ex: 16x19"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Input 
                  id="obs" 
                  value={formData.observations} 
                  onChange={e => setFormData({...formData, observations: e.target.value})} 
                  placeholder="Ex: Prefere tensão alta"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {editingCustomer ? 'Salvar Alterações' : 'Cadastrar'}
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
              placeholder="Buscar por nome ou telefone..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-x-auto">
            <Table>
              <TableHeader className="bg-sidebar/50">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Nome</TableHead>
                  <TableHead className="font-semibold text-foreground">Raquete</TableHead>
                  <TableHead className="font-semibold text-foreground">Padrão</TableHead>
                  <TableHead className="font-semibold text-foreground">Telefone</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-semibold">{customer.racket_brand || '-'}</span>
                          <span className="ml-1 text-muted-foreground">{customer.racket_model || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{customer.string_pattern || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openWhatsApp(customer.phone)} className="text-emerald-600 hover:bg-emerald-50">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { 
                            setEditingCustomer(customer); 
                            setFormData({ 
                              name: customer.name, 
                              phone: customer.phone, 
                              racketBrand: customer.racket_brand || '',
                              racketModel: customer.racket_model || '',
                              stringPattern: customer.string_pattern || '',
                              observations: customer.observations || '' 
                            }); 
                            setIsDialogOpen(true); 
                          }}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
