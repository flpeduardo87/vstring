import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';

interface AuthProps {
  onLogin: () => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [loading, setLoading] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const VALID_USERNAME = 'admin';
  const VALID_PASSWORD = 'vstring123';

  const handleAccess = async () => {
    if (loading) return;
    setLoading(true);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    setTimeout(() => {
      if (normalizedUsername === VALID_USERNAME && normalizedPassword === VALID_PASSWORD) {
        onLogin();
        toast.success('Bem-vindo ao VSTRING, Magnum!');
      } else {
        toast.error('Usuário ou senha inválidos.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 font-sans text-center relative overflow-hidden">
      {/* Animated background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <Logo className="h-40 w-40 mb-10" showText={false} />
        
        <h1 className="text-7xl font-black tracking-tighter italic mb-2">
          V<span className="text-primary font-bold">STRING</span>
        </h1>
        <p className="text-xs font-black text-primary uppercase tracking-[0.5em] mb-12 opacity-80">
          Performance & Precision Gear
        </p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="space-y-2 text-left">
            <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground">Usuário</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="h-12 rounded-xl"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="h-12 rounded-xl"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAccess();
                }
              }}
            />
          </div>

          <Button 
            onClick={handleAccess}
            disabled={loading || !username.trim() || !password.trim()}
            className="h-16 text-base font-black bg-primary text-primary-foreground rounded-2xl shadow-[0_0_40px_rgba(217,255,0,0.3)] hover:scale-105 active:scale-95 transition-all uppercase italic tracking-widest disabled:opacity-70"
          >
            {loading ? 'AUTENTICANDO...' : 'ACESSAR SISTEMA'}
          </Button>
          
          <div className="mt-4 flex flex-col gap-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-40">
              Sistema de Gestão Interna
            </p>
            <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-black italic">
              Magnum Victor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
