import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, RefreshCw, Database } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Configurações</h2>
        <p className="text-slate-200">Gerencie as preferências e informações do sistema.</p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
            <CardDescription>Informações da versão e status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">Nome do App</span>
              <span className="text-sm font-medium">Pro Stringer Canoinhas</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">Versão</span>
              <span className="text-sm font-medium">3.1.0 (Firebase)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">Status do Banco de Dados</span>
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Conectado (Firebase Cloud)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
