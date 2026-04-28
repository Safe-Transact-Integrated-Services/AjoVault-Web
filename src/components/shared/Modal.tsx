import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  onResend?: () => void;
  title?: string;
  description?: string;
  error?: string;
  isLoading?: boolean;
  isExpired?: boolean;
  secondsRemaining?: number;
  length?: number;
  clearError?: () => void;
}

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  onResend,
  title = 'Verify OTP',
  description = 'Enter the code sent to you to verify your identity.',
  error,
  isLoading = false,
  isExpired = false,
  secondsRemaining = 0,
  length = 6,
  clearError,
}: ModalProps) => {
  const [otp, setOtp] = useState('');

  // Reset OTP when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setOtp('');
    }
  }, [isOpen]);

  const handleChange = (value: string) => {
    const normalized = value.replace(/\D/g, '');
    setOtp(normalized);
    if (clearError) {
      clearError();
    }
  };

  const handleComplete = (value: string) => {
    if (value.length === length) {
      onSubmit(value);
    }
  };

  const handleResend = () => {
    if (onResend && !isLoading) {
      setOtp('');
      onResend();
    }
  };

  const handleSubmitClick = () => {
    if (otp.length === length) {
      onSubmit(otp);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          <InputOTP
            maxLength={length}
            value={otp}
            onChange={handleChange}
            onComplete={handleComplete}
            disabled={isLoading || isExpired}
          >
            <InputOTPGroup>
              {Array.from({ length }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <div className="flex w-full flex-col items-center space-y-2 text-center text-sm">
            {error && <p className="text-destructive font-medium">{error}</p>}
            
            {!isExpired && secondsRemaining > 0 && (
              <p className="text-muted-foreground">
                Code expires in {formatCountdown(secondsRemaining)}
              </p>
            )}

            {isExpired && onResend && (
              <div className="flex flex-col items-center space-y-3 w-full">
                <p className="text-destructive font-medium">OTP expired. Request a new code to continue.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Retry OTP
                </Button>
              </div>
            )}
            
            {!isExpired && secondsRemaining === 0 && onResend && (
               <div className="mt-2 text-muted-foreground">
                 Didn't receive a code?{' '}
                 <button
                   type="button"
                   onClick={handleResend}
                   disabled={isLoading}
                   className="text-primary font-medium hover:underline disabled:opacity-50"
                 >
                   Resend
                 </button>
               </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={otp.length !== length || isLoading || isExpired}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
