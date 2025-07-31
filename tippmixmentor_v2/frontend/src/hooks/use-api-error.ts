import { useCallback } from 'react';
import { useToast } from './use-toast';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export function useApiError() {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    let errorMessage = 'An unexpected error occurred';
    let errorStatus = 500;

    // Handle different error types
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
      errorStatus = error.status || 500;
    }

    // Log error for debugging
    console.error(`API Error in ${context || 'component'}:`, error);

    // Show user-friendly toast notification
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });

    // Return structured error object
    return {
      message: errorMessage,
      status: errorStatus,
      code: error?.code,
      details: error?.details,
    } as ApiError;
  }, [toast]);

  const handleNetworkError = useCallback((error: any) => {
    const errorMessage = 'Network error. Please check your connection and try again.';
    
    toast({
      title: 'Connection Error',
      description: errorMessage,
      variant: 'destructive',
    });

    return {
      message: errorMessage,
      status: 0,
      code: 'NETWORK_ERROR',
    } as ApiError;
  }, [toast]);

  const handleAuthError = useCallback((error: any) => {
    const errorMessage = 'Authentication failed. Please log in again.';
    
    toast({
      title: 'Authentication Error',
      description: errorMessage,
      variant: 'destructive',
    });

    // Redirect to login page
    window.location.href = '/auth';

    return {
      message: errorMessage,
      status: 401,
      code: 'AUTH_ERROR',
    } as ApiError;
  }, [toast]);

  const handleValidationError = useCallback((error: any) => {
    let errorMessage = 'Please check your input and try again.';
    
    if (error?.details?.validationErrors) {
      const validationErrors = error.details.validationErrors;
      errorMessage = Object.values(validationErrors).join(', ');
    }

    toast({
      title: 'Validation Error',
      description: errorMessage,
      variant: 'destructive',
    });

    return {
      message: errorMessage,
      status: 400,
      code: 'VALIDATION_ERROR',
      details: error?.details,
    } as ApiError;
  }, [toast]);

  const handleServerError = useCallback((error: any) => {
    const errorMessage = 'Server error. Please try again later.';
    
    toast({
      title: 'Server Error',
      description: errorMessage,
      variant: 'destructive',
    });

    return {
      message: errorMessage,
      status: 500,
      code: 'SERVER_ERROR',
    } as ApiError;
  }, [toast]);

  return {
    handleError,
    handleNetworkError,
    handleAuthError,
    handleValidationError,
    handleServerError,
  };
} 