import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsed = JSON.parse(error?.message || "{}");
        if (parsed.error) {
          errorMessage = `Erro no Firestore: ${parsed.error} (${parsed.operationType} em ${parsed.path})`;
        }
      } catch {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50 text-red-900">
          <AlertTriangle className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-center mb-6 max-w-md">{errorMessage}</p>
          <Button onClick={() => window.location.reload()} variant="destructive">
            Recarregar Aplicativo
          </Button>
        </div>
      );
    }

    return children;
  }
}
