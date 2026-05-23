import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, isOpen, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const codeReader = new BrowserMultiFormatReader();
    
    const startScanner = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError('Nenhuma câmera encontrada.');
          return;
        }

        // Prefer back camera if available
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('traseira')
        )?.deviceId || videoInputDevices[0].deviceId;

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText());
            onClose();
          }
        });
      } catch (err) {
        console.error('Scanner error:', err);
        setError('Erro ao acessar a câmera. Verifique as permissões.');
      }
    };

    startScanner();

    return () => {
      codeReader.reset();
    };
  }, [isOpen, onScan, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-200">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <p>{error}</p>
            </div>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-blue-500 rounded-lg shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]" />
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
