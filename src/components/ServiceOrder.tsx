import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ServiceOrderProps {
  service: any;
}

export function ServiceOrder({ service }: ServiceOrderProps) {
  if (!service) return null;

  const dateStr = service.date 
    ? format(service.date.toDate ? service.date.toDate() : new Date(service.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
    : format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

  return (
    <div 
      id={`os-${service.id}`}
      className="w-[210mm] h-[148.5mm] bg-white p-8 text-slate-900 flex flex-col border border-slate-200"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-600">VSTRING</h1>
          <p className="text-sm font-bold text-slate-500">CANOINHAS - SC</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase">Ordem de Serviço</h2>
          <p className="text-2xl font-mono font-bold text-blue-600">{service.service_number || `#${service.id?.substring(0, 8).toUpperCase()}`}</p>
          <p className="text-sm text-slate-500">{dateStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Left Side: Racket & Stringing */}
        <div className="space-y-4">
          <section>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-100 pb-1">Dados da Raquete</h3>
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-sm font-bold">Raquete:</span>
              <span className="text-sm">{(service.racket_brand || '')} {(service.racket_model || '')}</span>
              <span className="text-sm font-bold">Padrão:</span>
              <span className="text-sm">{service.string_pattern}</span>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-100 pb-1">Especificações de Tensão</h3>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold uppercase">Vertical (Mains)</span>
                <span className="text-xl font-mono font-black text-blue-700">{service.mains_tension} lbs</span>
              </div>
              <p className="text-xs text-slate-600 mb-2 truncate">{service.mains_description}</p>
              
              <div className="flex justify-between items-center mb-2 border-t border-slate-200 pt-2">
                <span className="text-sm font-bold uppercase">Horizontal (Crosses)</span>
                <span className="text-xl font-mono font-black text-blue-700">{service.crosses_tension} lbs</span>
              </div>
              <p className="text-xs text-slate-600 truncate">{service.crosses_description}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold uppercase">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Pre-Stretch</span>
                <span>{service.pre_stretch}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">Nós</span>
                <span>{service.knots}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Customer & Financial */}
        <div className="space-y-4 flex flex-col">
          <section>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-100 pb-1">Dados do Cliente</h3>
            <div className="space-y-1">
              <p className="text-lg font-bold truncate">{service.customer_name}</p>
              <p className="text-sm text-slate-600 italic">Cliente VSTRING</p>
            </div>
          </section>

          <section className="flex-1">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-100 pb-1">Itens Adicionais e Valores</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Mão de Obra</span>
                <span>R$ {Number(service.labor_price || 0).toFixed(2)}</span>
              </div>
              {service.extra_products && service.extra_products.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-sm text-slate-600">
                  <span className="truncate max-w-[150px]">{p.description} (x{p.quantity})</span>
                  <span>R$ {(p.price * p.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 text-white p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase opacity-70">Total do Serviço</span>
                <span className="text-2xl font-mono font-black">R$ {Number(service.price || 0).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <Badge className={service.payment_status === 'pago' ? "bg-emerald-500" : "bg-red-500"}>
                  {service.payment_status === 'pago' ? 'PAGO' : 'PENDENTE'}
                </Badge>
                <p className="text-[10px] font-bold mt-1 opacity-70 uppercase">{service.payment_method}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer / QR Code Placeholder / Notes */}
      <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center">
        <p className="text-[10px] text-slate-400 leading-tight">
          Obrigado pela confiança! Esta OS deve ser anexada à raquete para identificação técnica.<br/>
          Confira sua tensão e padrão de encordoamento. Dúvidas: (47) 9999-9999
        </p>
      </div>
    </div>
  );
}
