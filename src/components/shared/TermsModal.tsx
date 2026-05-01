import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

const TermsModal = ({ isOpen, onClose, onAccept, isLoading = false }: TermsModalProps) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  // Reset agreement when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasAgreed(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 pr-12">
          <DialogTitle className="text-2xl font-bold text-[#102A56]">Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please review our terms of service and privacy policy before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-2">
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-slate-50/50">
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <section>
                <h3 className="font-bold text-[#102A56] mb-1">1. Acceptance of Terms</h3>
                <p>By creating an account with AjoVault, you agree to be bound by these Terms and Conditions, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
              </section>
              
              <section>
                <h3 className="font-bold text-[#102A56] mb-1">2. Use License</h3>
                <p>Permission is granted to temporarily use the AjoVault platform for personal, non-commercial transitory viewing and financial management only.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#102A56] mb-1">3. Privacy Policy</h3>
                <p>Your privacy is important to us. It is AjoVault's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#102A56] mb-1">4. Account Security</h3>
                <p>You are responsible for maintaining the confidentiality of your account password and PIN. AjoVault cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.</p>
              </section>

              <section>
                <h3 className="font-bold text-[#102A56] mb-1">5. Financial Transactions</h3>
                <p>All financial transactions performed on the AjoVault platform are subject to verification and regulatory compliance checks. Users must provide accurate information for KYC purposes.</p>
              </section>

              <section>
                <p className="italic text-xs mt-4">Last updated: May 2026</p>
              </section>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-4 flex sm:flex-col gap-4 bg-slate-50/80">
          <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-200">
            <Checkbox 
              id="terms-agree" 
              checked={hasAgreed} 
              onCheckedChange={(checked) => setHasAgreed(checked === true)}
              disabled={isLoading}
            />
            <Label 
              htmlFor="terms-agree" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I agree to the Terms of Service and Privacy Policy
            </Label>
          </div>
          
          <Button
            onClick={onAccept}
            disabled={isLoading || !hasAgreed}
            className="w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase tracking-wider h-12 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? 'Processing...' : 'Accept & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
