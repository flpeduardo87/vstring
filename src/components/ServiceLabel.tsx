import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';

interface ServiceLabelProps {
  service: any;
}

export function ServiceLabel({ service }: ServiceLabelProps) {
  // Use blueprint/firestore names
  const customerName = service.customer_name || service.customerName || '-';
  const racketModel = service.racket_model || service.racketModel || '-';
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
    customer: customerName,
    racket: racketModel,
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
        <p className="text-base font-bold text-slate-500 uppercase tracking-widest">{racketModel}</p>
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

        <div className="mt-auto bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 flex flex-col items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Valor Total</span>
          <div className="text-4xl font-black text-slate-900">
            <span className="text-base font-bold mr-1">R$</span>
            {Number(price).toFixed(2)}
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
          <p className="text-[10px] font-black text-slate-400 uppercase leading-tight italic">
            "A precisão que o seu<br />jogo merece."
          </p>
        </div>
        <div className="p-2 bg-white border-2 border-slate-100 rounded-xl">
          <QRCodeSVG value={qrValue} size={80} level="H" />
        </div>
      </div>
      
      <div className="text-center text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-4">
        VSTRING - MAGNUM VICTOR • (47) 9 9999-9999
      </div>
    </div>
  );
}
