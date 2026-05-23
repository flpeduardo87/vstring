import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Calendar, User, Tag } from 'lucide-react';

interface ServiceLabelProps {
  service: any;
}

export function ServiceLabel({ service }: ServiceLabelProps) {
  // Use blueprint/firestore names
  const customerName = service.customer_name || service.customerName || '-';
  const racketBrand = service.racket_brand || '';
  const racketModel = service.racket_model || service.racketModel || '';
  const racketFull = `${racketBrand} ${racketModel}`.trim() || '-';
  const mainsTension = service.mains_tension || service.mainsTension || 0;
  const crossesTension = service.crosses_tension || service.crossesTension || 0;
  const mainsDescription = service.mains_description || service.mainsDescription || '-';
  const crossesDescription = service.crosses_description || service.crossesDescription || '-';
  const price = service.price || 0;
  const preStretch = service.pre_stretch || 0;
  const knots = service.knots || '4 nós';
  const pattern = service.string_pattern || '-';
  
  const dateObj = service.date?.toDate ? service.date.toDate() : (service.date ? new Date(service.date) : new Date());

  const qrValue = JSON.stringify({
    id: service.id,
    os: service.service_number || `#${service.id?.substring(0, 4)}`,
    customer: customerName,
    racket: racketFull,
    mains: `${mainsDescription} @ ${mainsTension}lbs`,
    crosses: `${crossesDescription} @ ${crossesTension}lbs`,
    date: dateObj.toISOString()
  });

  return (
    <div id={`label-${service.id}`} className="w-[99mm] h-[210mm] p-8 bg-white flex flex-col gap-6 text-slate-900 font-sans border-2 border-slate-200">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 border-b-4 border-slate-900 pb-6">
        <div className="bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
          VSTRING - PROFESSIONAL STRINGER
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mt-2">{customerName}</h1>
        <p className="text-base font-bold text-slate-500 uppercase tracking-widest">{racketFull}</p>
      </div>

      {/* Main Stats */}
      <div className="flex-1 flex flex-col gap-8 py-4">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vertical (Mains)</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] font-bold">{pattern}</span>
            </div>
            <p className="text-base font-bold line-clamp-2">{mainsDescription}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-blue-700">{mainsTension}</span>
              <span className="text-xl font-black text-blue-400 uppercase">lbs</span>
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horizontal (Crosses)</span>
            <p className="text-base font-bold line-clamp-2">{crossesDescription}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-blue-700">{crossesTension}</span>
              <span className="text-xl font-black text-blue-400 uppercase">lbs</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pre-Stretch</span>
            <p className="text-lg font-black text-slate-700">{preStretch}%</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nós</span>
            <p className="text-lg font-black text-slate-700">{knots}</p>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          {service.extra_products && service.extra_products.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Produtos Adicionais</span>
              <div className="space-y-1">
                {service.extra_products.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-[10px] font-bold">
                    <span className="truncate max-w-[150px]">{p.description} (x{p.quantity})</span>
                    <span>R$ {(p.price * p.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center gap-1 shadow-lg">
            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest text-center">Valor Total do Serviço</span>
            <div className="text-4xl font-black">
              <span className="text-base font-bold mr-1 italic">R$</span>
              {Number(price).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with QR */}
      <div className="mt-auto pt-8 border-t-4 border-slate-900 flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-600 uppercase">{format(dateObj, 'dd/MM/yyyy')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase">{service.service_number || `#${service.id?.substring(0, 4)}`}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase leading-tight italic">
            "A precisão que o seu<br />jogo merece."
          </p>
        </div>
        <div className="p-2 bg-white border-2 border-slate-100 rounded-xl">
          <QRCodeSVG value={qrValue} size={80} level="H" />
        </div>
      </div>
      
      <div className="text-center text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-4">
        VSTRING - VICTOR • (47) 9 9999-9999
      </div>
    </div>
  );
}
