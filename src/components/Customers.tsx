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
  const [dialogKey, setDialogKey] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerRackets, setCustomerRackets] = useState<any[]>([]);
  const [isRacketDialogOpen, setIsRacketDialogOpen] = useState(false);
  const [editingRacket, setEditingRacket] = useState<any>(null);
  const [racketFormData, setRacketFormData] = useState({
    brand: '',
    model: '',
    stringPattern: '',
    observations: ''
  });
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: ''
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

  useEffect(() => {
    if (editingCustomer) {
      const q = query(collection(db, 'customers', editingCustomer.id, 'rackets'), orderBy('brand', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomerRackets(docs);
      });
      return () => unsubscribe();
    } else {
      setCustomerRackets([]);
    }
  }, [editingCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name.trim() || '',
        phone: formData.phone.trim() || '',
        updated_at: serverTimestamp()
      };

      // Check for duplicates
      const nameDuplicate = customers.find(c => 
        c.name?.toLowerCase() === data.name.toLowerCase() && 
        c.id !== editingCustomer?.id
      );
      
      if (nameDuplicate) {
        return toast.error('Já existe um cliente cadastrado com este nome!');
      }

      const phoneDuplicate = customers.find(c => 
        c.phone?.replace(/\D/g, '') === data.phone.replace(/\D/g, '') && 
        c.id !== editingCustomer?.id
      );

      if (phoneDuplicate) {
        return toast.error('Já existe um cliente cadastrado com este telefone!');
      }

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

      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: ''
      });
      setIsDialogOpen(false);
      setDialogKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar cliente.');
    }
  };

  const handleRacketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const data = {
        brand: racketFormData.brand,
        model: racketFormData.model,
        string_pattern: racketFormData.stringPattern,
        observations: racketFormData.observations,
        updated_at: serverTimestamp()
      };

      if (editingRacket) {
        await updateDoc(doc(db, 'customers', editingCustomer.id, 'rackets', editingRacket.id), data);
        toast.success('Raquete atualizada!');
      } else {
        await addDoc(collection(db, 'customers', editingCustomer.id, 'rackets'), {
          ...data,
          created_at: serverTimestamp()
        });
        toast.success('Raquete adicionada!');
      }

      setIsRacketDialogOpen(false);
      setEditingRacket(null);
      setRacketFormData({
        brand: '',
        model: '',
        stringPattern: '',
        observations: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar raquete.');
    }
  };

  const handleDeleteRacket = async (racketId: string) => {
    if (!editingCustomer || !confirm('Excluir esta raquete?')) return;
    try {
      await deleteDoc(doc(db, 'customers', editingCustomer.id, 'rackets', racketId));
      toast.success('Raquete excluída.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir raquete.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Clientes</h2>
          <p className="text-slate-200">Gerencie sua base de clientes e histórico.</p>
        </div>
        <Dialog key={dialogKey} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button
                onClick={() => {
                  setEditingCustomer(null);
                  setFormData({
                    name: '',
                    phone: ''
                  });
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="space-y-4">
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
              </div>

              {editingCustomer && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Raquetes do Cliente</h3>
                    <Dialog open={isRacketDialogOpen} onOpenChange={setIsRacketDialogOpen}>
                      <DialogTrigger
                        render={
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRacket(null);
                              setRacketFormData({
                                brand: '',
                                model: '',
                                stringPattern: '',
                                observations: ''
                              });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Raquete
                          </Button>
                        }
                      />
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingRacket ? 'Editar Raquete' : 'Nova Raquete'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRacketSubmit} className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Marca</Label>
                              <Input 
                                value={racketFormData.brand}
                                onChange={e => setRacketFormData({...racketFormData, brand: e.target.value})}
                                required
                                placeholder="Wilson"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Modelo</Label>
                              <Input 
                                value={racketFormData.model}
                                onChange={e => setRacketFormData({...racketFormData, model: e.target.value})}
                                required
                                placeholder="Blade 98"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Padrão</Label>
                            <Input 
                              value={racketFormData.stringPattern}
                              onChange={e => setRacketFormData({...racketFormData, stringPattern: e.target.value})}
                              placeholder="16x19"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Obs. da Raquete</Label>
                            <Input 
                              value={racketFormData.observations}
                              onChange={e => setRacketFormData({...racketFormData, observations: e.target.value})}
                              placeholder="Peso extra no cabo"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                              {editingRacket ? 'Salvar Raquete' : 'Adicionar Raquete'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {customerRackets.map(racket => (
                      <div key={racket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{racket.brand} {racket.model}</p>
                          <p className="text-[10px] text-slate-500">{racket.string_pattern || 'Padrão não inf.'}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingRacket(racket);
                              setRacketFormData({
                                brand: racket.brand,
                                model: racket.model,
                                stringPattern: racket.string_pattern || '',
                                observations: racket.observations || ''
                              });
                              setIsRacketDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleDeleteRacket(racket.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {customerRackets.length === 0 && (
                      <p className="text-center py-4 text-xs text-slate-400 italic">Nenhuma raquete cadastrada.</p>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-slate-100">
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingCustomer ? 'Salvar Alterações do Cliente' : 'Cadastrar Cliente'}
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
          <div className="rounded-md border border-slate-100 overflow-x-auto">
            <Table>
                  <TableHeader className="bg-slate-50 text-black">
                <TableRow>
                  <TableHead className="font-semibold text-black">Nome</TableHead>
                  <TableHead className="font-semibold text-black">Telefone</TableHead>
                  <TableHead className="text-right font-semibold text-black">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-white">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-white">
                          <Phone className="h-3 w-3 text-white/80" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openWhatsApp(customer.phone)} className="text-white hover:bg-white/10" title="WhatsApp">
                            <MessageSquare className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { 
                            setEditingCustomer(customer); 
                            setFormData({ 
                              name: customer.name, 
                              phone: customer.phone
                            }); 
                            setIsDialogOpen(true); 
                          }} title="Editar / Ver Raquetes">
                            <Edit2 className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-white">
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
