import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, runTransaction } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Printer, MessageSquare, CheckCircle, Clock, Trash2, Camera, Eye, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceOrder } from './ServiceOrder';
import { ServiceLabel } from './ServiceLabel';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrorHandler';

import { ServiceForm } from './ServiceForm';

export function Services({ initialFilter }: { initialFilter?: string | null }) {
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [previewService, setPreviewService] = useState<any>(null);
  const [printingService, setPrintingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    racketId: '',
    racketBrand: '',
    racketModel: '',
    stringPattern: '16x19',
    racketObservations: '',
    mainsId: '',
    mainsDescription: '',
    mainsTension: '',
    crossesId: '',
    crossesDescription: '',
    crossesTension: '',
    preStretch: '0',
    knots: '4 nós',
    laborPrice: '55',
    price: '',
    status: 'pendente',
    paymentStatus: 'pendente',
    paymentMethod: 'Pix',
    observations: '',
    extraProducts: [] as any[]
  });

  useEffect(() => {
    const qServices = query(collection(db, 'services'), orderBy('date', 'desc'));
    const qCustomers = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const qInventory = query(collection(db, 'inventory'), orderBy('description', 'asc'));
    const qTeam = query(collection(db, 'team'), orderBy('name', 'asc'));

    const unsubServices = onSnapshot(qServices, (s) => setServices(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'services'));
    const unsubCustomers = onSnapshot(qCustomers, (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));
    const unsubInventory = onSnapshot(qInventory, (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'inventory'));

    if (initialFilter) {
      if (initialFilter === 'new') {
        setIsDialogOpen(true);
        setEditingServiceId(null);
      } else {
        setStatusFilter(initialFilter);
      }
    }

    return () => {
      unsubServices();
      unsubCustomers();
      unsubInventory();
    };
  }, [initialFilter]);

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
          const totalMeters = Number(mainString.total_meters || 200);
          const pricePerMeter = sellPrice / totalMeters;
          // Regra: 6m nas horizontais e 6m nas verticais.
          // Se for híbrido, o custo desta corda é para a metade usada (6m).
          // Se não for híbrido, usamos o total (12m).
          stringCost = isHybrid ? (pricePerMeter * 6) : (pricePerMeter * 12);
        } else {
          // Para unidade (set já individual), se for híbrido usa metade do preço, senão integral.
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
          const totalMeters = Number(crossString.total_meters || 200);
          const pricePerMeter = sellPrice / totalMeters;
          // Para a híbrida na horizontal, usamos 6m.
          stringCost = pricePerMeter * 6;
        } else {
          // Para unidade, usamos metade do set.
          stringCost = sellPrice / 2;
        }
        totalStringPrice += stringCost;
      }
    }

    const extraProductsPrice = formData.extraProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const finalPrice = labor + totalStringPrice + extraProductsPrice;
    setFormData(prev => ({ ...prev, price: finalPrice.toFixed(2) }));
  }, [formData.laborPrice, formData.mainsId, formData.crossesId, formData.extraProducts, inventory]);

  const handleStatusChange = async (id: string, field: 'status' | 'paymentStatus', newValue: string) => {
    try {
      const updateData: any = { 
        [field === 'status' ? 'status' : 'payment_status']: newValue,
        updated_at: serverTimestamp()
      };
      
      if (field === 'status' && newValue === 'finalizado') {
        updateData.effective_pickup_date = serverTimestamp();
      }

      await updateDoc(doc(db, 'services', id), updateData);
      toast.success('Status atualizado!');
      
      if (field === 'status' && newValue === 'finalizado') {
        const service = services.find(s => s.id === id);
        if (service) {
          notifyCustomer(service);
        }
        setTimeout(() => {
          downloadOS(id);
        }, 800);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status.');
    }
  };

  const downloadOS = async (id: string, customService?: any) => {
    const targetService = customService || services.find(s => s.id === id);
    if (!targetService) return;

    setPrintingService(targetService);

    setTimeout(async () => {
      const element = document.getElementById(`print-os`);
      if (!element) return;
      
      try {
        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        
        // A5 size: 148 x 210 mm
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a5'
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 148.5);
        pdf.save(`os-vstring-${id.substring(0,8)}.pdf`);
        setPrintingService(null);
      } catch (err) {
        console.error("OS generation error:", err);
        setPrintingService(null);
      }
    }, 100);
  };

  const downloadLabel = async (id: string, customService?: any) => {
    const targetService = customService || services.find(s => s.id === id);
    if (!targetService) return;

    setPrintingService(targetService);

    setTimeout(async () => {
      const element = document.getElementById(`label-${targetService.id}`);
      if (!element) return;
      
      try {
        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        
        // 1/3 A4 size: approx 99mm x 210mm
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [99, 210]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 99, 210);
        pdf.save(`tag-vstring-${id.substring(0,8)}.pdf`);
        setPrintingService(null);
      } catch (err) {
        console.error("Tag generation error:", err);
        toast.error("Erro ao gerar etiqueta.");
        setPrintingService(null);
      }
    }, 150);
  };

  const notifyCustomer = (service: any) => {
    const customer = customers.find(c => c.id === service.customer_id);
    if (!customer || !customer.phone) {
      toast.error('Cliente sem telefone cadastrado para aviso.');
      return;
    }
    
    let cleanPhone = customer.phone.replace(/\D/g, '');
    // Se não tiver o DDI 55 e tiver 10 ou 11 dígitos, adiciona o 55
    if (cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    const message = encodeURIComponent(`Olá ${customer.name.toUpperCase()}! Sua raquete ${service.racket_model.toUpperCase()} está PRONTA! 🎾 Já pode passar aqui na VSTRING para retirá-la. Estamos te aguardando! Att, Victor`);
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEdit = (service: any) => {
    setEditingServiceId(service.id);
    setFormData({
      customerId: service.customer_id,
      racketId: service.racket_id || '',
      racketBrand: service.racket_brand || '',
      racketModel: service.racket_model,
      stringPattern: service.string_pattern,
      racketObservations: service.racket_observations || '',
      mainsId: service.mains_id || 'manual',
      mainsDescription: service.mains_description || '',
      mainsTension: (service.mains_tension || '').toString(),
      crossesId: service.crosses_id || 'manual',
      crossesDescription: service.crosses_description || '',
      crossesTension: (service.crosses_tension || '').toString(),
      preStretch: (service.pre_stretch || 0).toString(),
      knots: service.knots,
      laborPrice: (service.labor_price || 55).toString(),
      price: service.price.toString(),
      status: service.status || 'pendente',
      paymentStatus: service.payment_status || 'pendente',
      paymentMethod: service.payment_method || 'Pix',
      observations: service.observations || '',
      extraProducts: service.extra_products || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
        toast.success('Serviço excluído!');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir serviço.');
      }
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = (s.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (s.racket_model?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Serviços</h2>
          <p className="text-slate-200">Controle de encordoamentos e etiquetas inteligentes.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingServiceId(null);
          }
        }}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Novo Serviço
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingServiceId ? 'Editar Serviço' : 'Registrar Novo Encordoamento'}</DialogTitle>
            </DialogHeader>
            <ServiceForm 
              key={editingServiceId || 'new'}
              customers={customers}
              inventory={inventory}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingServiceId(null);
              }}
              onSubmit={async (data) => {
                try {
                  const serviceData = {
                    customer_id: data.customerId,
                    customer_name: data.customer_name || 'Cliente Desconhecido',
                    racket_id: data.racketId || '',
                    racket_brand: data.racketBrand || '',
                    racket_model: data.racketModel || '',
                    string_pattern: data.stringPattern || '',
                    racket_observations: data.racketObservations || '',
                    mains_id: data.mainsId || 'manual',
                    mains_description: data.mainsDescription || '',
                    mains_tension: Number(data.mainsTension) || 0,
                    crosses_id: data.crossesId || 'manual',
                    crosses_description: data.crossesDescription || '',
                    crosses_tension: Number(data.crossesTension) || 0,
                    pre_stretch: Number(data.preStretch) || 0,
                    knots: data.knots || '4 nós',
                    labor_price: Number(data.laborPrice) || 0,
                    extra_products: data.extraProducts || [],
                    price: Number(data.price) || 0,
                    status: data.status || 'pendente',
                    payment_status: data.paymentStatus || 'pendente',
                    payment_method: data.paymentMethod || 'Pix',
                    observations: data.observations || '',
                    updated_at: serverTimestamp()
                  };

                  if (editingServiceId) {
                    const oldService = services.find(s => s.id === editingServiceId);
                    await updateDoc(doc(db, 'services', editingServiceId), serviceData);
                    toast.success('Serviço atualizado!');
                    
                    if (serviceData.status === 'finalizado' && oldService?.status !== 'finalizado') {
                      notifyCustomer({ ...serviceData, id: editingServiceId });
                    }
                    
                    setIsDialogOpen(false);
                    setEditingServiceId(null);
                  } else {
                    // Use a transaction to get the next service order number
                    let docRef: any = null;
                    let savedService: any = null;

                    await runTransaction(db, async (transaction) => {
                      const counterRef = doc(db, 'counters', 'service_order');
                      const counterDoc = await transaction.get(counterRef);
                      
                      let nextNumber = 0;
                      if (counterDoc.exists()) {
                        nextNumber = counterDoc.data().count;
                      }
                      
                      const formattedNumber = `#${nextNumber.toString().padStart(4, '0')}`;
                      
                      const fullServiceData = {
                        ...serviceData,
                        service_number: formattedNumber,
                        date: serverTimestamp(),
                        created_at: serverTimestamp()
                      };

                      docRef = doc(collection(db, 'services'));
                      transaction.set(docRef, fullServiceData);
                      transaction.set(counterRef, { count: nextNumber + 1 });
                      
                      savedService = { 
                        ...fullServiceData, 
                        id: docRef.id,
                        date: { toDate: () => new Date() }, // Mock for ServiceLabel
                        created_at: { toDate: () => new Date() }
                      };
                    });

                    toast.success('Serviço registrado com sucesso!');
                    
                    // Deduct inventory after successful service creation
                    const deductFromInventory = async (id: string, amount: number) => {
                      if (!id || id === 'manual') return;
                      try {
                        const itemDoc = await getDoc(doc(db, 'inventory', id));
                        if (itemDoc.exists()) {
                          const currentQty = itemDoc.data().quantity || 0;
                          await updateDoc(doc(db, 'inventory', id), {
                            quantity: Math.max(0, currentQty - amount),
                            updated_at: serverTimestamp()
                          });
                        }
                      } catch (err) {
                        console.error(`Error deducting inventory for ${id}:`, err);
                      }
                    };

                    if (data.mainsId) {
                      const item = inventory.find(i => i.id === data.mainsId);
                      const isHybrid = data.mainsId !== data.crossesId;
                      const amount = item?.type === 'rolo' ? (isHybrid ? 6 : 12) : (isHybrid ? 0.5 : 1);
                      await deductFromInventory(data.mainsId, amount);
                    }
                    if (data.crossesId && data.crossesId !== data.mainsId) {
                      const item = inventory.find(i => i.id === data.crossesId);
                      const amount = item?.type === 'rolo' ? 6 : 0.5;
                      await deductFromInventory(data.crossesId, amount);
                    }

                    for (const p of data.extraProducts) {
                      await deductFromInventory(p.productId, p.quantity);
                    }

                    setIsDialogOpen(false);
                    setEditingServiceId(null);
                    
                    if (data.status === 'finalizado') {
                      notifyCustomer(savedService);
                    }

                    setTimeout(() => {
                      downloadLabel(docRef.id, savedService);
                    }, 500);
                  }
                } catch (error) {
                  console.error(error);
                  toast.error('Erro ao salvar serviço. Tente novamente.');
                }
              }}
              initialData={editingServiceId ? services.find(s => s.id === editingServiceId) : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por cliente ou raquete..." 
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter || 'todos'} onValueChange={v => setStatusFilter(v === 'todos' ? null : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pendente">Em andamento</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-100 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-700 text-white">
                <TableRow>
                  <TableHead className="text-white">OS</TableHead>
                  <TableHead className="text-white">Data</TableHead>
                  <TableHead className="text-white">Cliente</TableHead>
                  <TableHead className="text-white">Raquete</TableHead>
                  <TableHead className="text-white">Tensão (lbs)</TableHead>
                  <TableHead className="text-white">Status Serviço</TableHead>
                  <TableHead className="text-white">Pagamento</TableHead>
                  <TableHead className="text-right text-white">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-mono font-bold text-white">
                        {service.service_number || `#${service.id.substring(0, 4)}`}
                      </TableCell>
                      <TableCell className="text-sm text-white">
                        {service.date ? format(service.date.toDate(), 'dd/MM/yy') : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-white">{service.customer_name}</TableCell>
                      <TableCell className="text-white">{(service.racket_brand || '')} {service.racket_model}</TableCell>
                      <TableCell className="text-white">
                        <Badge variant="outline" className="bg-blue-50 text-black border-blue-100">
                          {service.mains_tension} / {service.crosses_tension}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {service.status === 'finalizado' ? (
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Finalizado</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-slate-800 hover:bg-amber-200">Em andamento</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        <Badge variant="outline" className={service.payment_status === 'pago' ? 'bg-emerald-50 text-slate-800 border-emerald-100' : 'bg-red-50 text-slate-800 border-red-100'}>
                          {service.payment_status === 'pago' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {service.status === 'pendente' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="bg-emerald-50 text-slate-800 hover:bg-emerald-100 border border-emerald-100 h-8 px-2"
                              onClick={() => handleStatusChange(service.id, 'status', 'finalizado')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewService(service)}>
                            <Eye className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Imprimir OS Completa (A5)" onClick={() => downloadOS(service.id)}>
                            <Printer className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Imprimir Etiqueta Raquete (1/3 A4)" onClick={() => downloadLabel(service.id)}>
                            <Tag className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => notifyCustomer(service)}>
                            <MessageSquare className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                            <Edit2 className="h-4 w-4 text-white" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-white">
                      Nenhum serviço encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewService} onOpenChange={() => setPreviewService(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
            {previewService && <ServiceOrder service={previewService} />}
            <div className="flex gap-4 p-4 bg-slate-50 border-t items-center justify-end">
              <Button variant="outline" onClick={() => setPreviewService(null)}>Fechar</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { downloadOS(previewService.id); setPreviewService(null); }}>
                <Printer className="mr-2 h-4 w-4" /> Baixar OS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Persistent Print Container (Hidden) */}
      <div className="fixed -left-[5000px] top-0 pointer-events-none shadow-none">
        {printingService && (
          <>
            <div id="print-os">
              <ServiceOrder service={printingService} />
            </div>
            <div id={`label-${printingService.id}`}>
              <ServiceLabel service={printingService} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
