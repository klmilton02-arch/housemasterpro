import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ScanAppointmentDialog({ open, onOpenChange, onTaskCreated }) {
  const [step, setStep] = useState('upload'); // upload, preview, success, error
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState(null);
  const [fileInput, setFileInput] = useState(null);
  const [cameraInput, setCameraInput] = useState(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const url = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(url.file_url);
      setStep('preview');
      handleScan(url.file_url);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const handleScan = async (url) => {
    setProcessing(true);
    
    try {
      const response = await base44.functions.invoke('scanAppointment', {
        file_url: url
      });

      setExtracted(response.extracted);
      setStep('success');
      onTaskCreated?.();
      
      // Reset after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to scan appointment. Please try again.');
      setStep('error');
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFileUrl(null);
    setExtracted(null);
    setError(null);
    setFileInput(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Scan Appointment</DialogTitle>
          <DialogDescription>
            Take a photo or upload an image of your appointment reminder
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => fileInput?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </Button>
              <Button
                 variant="outline"
                 className="flex-1 gap-2"
                 onClick={() => cameraInput?.click()}
                 disabled={uploading}
               >
                 <Camera className="w-4 h-4" />
                 Take Photo
               </Button>
                <input
                  ref={setCameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
            </div>
            <input
              ref={setFileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting appointment details...
            </div>
          </div>
        )}

        {step === 'success' && extracted && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Appointment Added!</span>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3 space-y-2 text-sm">
              {extracted.doctor_name && (
                <div>
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="font-medium">{extracted.doctor_name}</p>
                </div>
              )}
              {extracted.date && (
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{extracted.date}</p>
                </div>
              )}
              {extracted.time && (
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{extracted.time}</p>
                </div>
              )}
              {extracted.location && (
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{extracted.location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={() => {
                setStep('upload');
                setError(null);
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}