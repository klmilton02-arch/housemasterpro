import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, CalendarDays, Receipt, ListChecks } from 'lucide-react';

export default function ScanAppointmentDialog({ open, onOpenChange, onTaskCreated }) {
  const [step, setStep] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [createdTasks, setCreatedTasks] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await base44.integrations.Core.UploadFile({ file });
      setStep('scanning');
      setUploading(false);
      await handleScan(url.file_url);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      setStep('error');
      setUploading(false);
    }
  };

  const handleScan = async (url) => {
    try {
      const response = await base44.functions.invoke('scanAppointment', { file_url: url });
      const data = response.data;
      if (!data.success) {
        setError(data.error || 'Could not detect content in image.');
        setStep('error');
        return;
      }
      setExtracted(data.extracted);
      setCreatedTasks(data.created_tasks || []);
      setStep('success');
      onTaskCreated?.();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to scan image.';
      setError(msg);
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setExtracted(null);
    setCreatedTasks([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Scan Image</DialogTitle>
          <DialogDescription>
            Detects appointments, bills, and handwritten tasks automatically
          </DialogDescription>
        </DialogHeader>

        {/* Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4" /> Upload Photo
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
                <Camera className="w-4 h-4" /> Take Photo
              </Button>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="font-medium text-foreground mb-1">What can be scanned:</p>
              <p>📅 Appointment reminders — date, time & name</p>
              <p>💳 Bills & invoices — due date & bill type</p>
              <p>✏️ Handwritten task lists — each item as a task</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </div>
            )}
          </div>
        )}

        {/* Scanning */}
        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="font-medium">Analyzing image...</p>
            <p className="text-xs">Detecting appointments, bills, and tasks</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && extracted && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">{createdTasks.length} item{createdTasks.length !== 1 ? 's' : ''} added!</span>
            </div>

            {/* Appointment */}
            {extracted.has_appointment && extracted.appt_date && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Appointment
                </div>
                {extracted.appt_name && <Row label="Name" value={extracted.appt_name} />}
                {extracted.appt_date && <Row label="Date" value={extracted.appt_date} />}
                {extracted.appt_time && <Row label="Time" value={extracted.appt_time} />}
                {extracted.appt_location && <Row label="Location" value={extracted.appt_location} />}
              </div>
            )}

            {/* Bill */}
            {extracted.has_bill && (extracted.bill_provider || extracted.bill_type) && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                  <Receipt className="w-3.5 h-3.5" /> Bill
                </div>
                {extracted.bill_provider && <Row label="Provider" value={extracted.bill_provider} />}
                {extracted.bill_type && <Row label="Type" value={extracted.bill_type} />}
                {extracted.bill_amount && <Row label="Amount" value={extracted.bill_amount} />}
                {extracted.bill_due_day && <Row label="Due Day" value={`Day ${extracted.bill_due_day} of each month`} />}
                {extracted.bill_due_date && !extracted.bill_due_day && <Row label="Due Date" value={extracted.bill_due_date} />}
              </div>
            )}

            {/* Tasks */}
            {extracted.has_tasks && Array.isArray(extracted.task_list) && extracted.task_list.length > 0 && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                  <ListChecks className="w-3.5 h-3.5" /> Tasks ({extracted.task_list.length})
                </div>
                {extracted.task_list.map((t, i) => (
                  <div key={i} className="text-sm text-foreground">
                    <span className="text-muted-foreground mr-1">•</span>{t.name}
                    {t.notes && <span className="text-xs text-muted-foreground ml-1">— {t.notes}</span>}
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Scan Failed</span>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => { setStep('upload'); setError(null); }} className="w-full">Try Again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-foreground text-sm">{value}</p>
    </div>
  );
}