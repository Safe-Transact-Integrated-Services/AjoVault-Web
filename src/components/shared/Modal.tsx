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

          <div className="flex w-full flex-col items-center space-y-4 text-center">
            {error && <p className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md w-full">{error}</p>}

            {isExpired && (
              <p className="text-sm font-medium text-destructive">
                OTP expired. Request a new code to continue.
              </p>
            )}

            {onResend && (
              <div className="w-full space-y-3">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-muted-foreground">Didn't receive a code?</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={isLoading || (!isExpired && secondsRemaining > 0)}
                    className="w-full h-11 font-black uppercase tracking-wider border-2 bg-[#102A56] text-slate-50 hover:text-[#102A56] hover:bg-slate-50 transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {!isExpired && secondsRemaining > 0
                      ? `Resend in ${formatCountdown(secondsRemaining)}`
                      : 'Resend OTP'}
                  </Button>
                </div>
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
            className='hover:text-slate-50 hover:bg-[#102A56]'
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={otp.length !== length || isLoading || isExpired}
            className="bg-[#102A56] hover:bg-[#1d3a6d] text-white font-bold px-8 rounded-lg"
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
