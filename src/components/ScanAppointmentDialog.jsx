import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, CalendarDays, Receipt, ListChecks } from 'lucide-react';

const TYPE_CONFIG = {
  appointment: { icon: CalendarDays, label: 'Appointment', color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' },
  bill: { icon: Receipt, label: 'Bill', color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' },
  tasks: { icon: ListChecks, label: 'Tasks', color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' },
};

function EditableField({ label, value, fieldKey, editField, editValue, onStartEdit, onSaveEdit, onEditChange }) {
  if (editField === fieldKey) {
    return (
      <div>
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            className="flex-1 px-2 py-1 border border-input rounded text-foreground bg-background text-sm"
            autoFocus
          />
          <Button size="sm" onClick={onSaveEdit} className="px-3">Save</Button>
        </div>
      </div>
    );
  }
  if (!value) return null;
  return (
    <div className="flex items-center justify-between group">
      <div className="flex-1">
        <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
        <p className="font-semibold text-foreground text-sm">{value}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onStartEdit(fieldKey, value)} className="opacity-0 group-hover:opacity-100 text-xs">Edit</Button>
    </div>
  );
}

export default function ScanAppointmentDialog({ open, onOpenChange, onTaskCreated }) {
  const [step, setStep] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [createdTasks, setCreatedTasks] = useState([]);
  const [error, setError] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
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
      handleScan(url.file_url);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      setStep('error');
      setUploading(false);
    }
  };

  const handleScan = async (url) => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('scanAppointment', { file_url: url });
      const data = response.data;
      setExtracted(data.extracted);
      setCreatedTasks(data.created_tasks || []);
      setStep('success');
      setProcessing(false);
      onTaskCreated?.();
    } catch (err) {
      setError(err.message || 'Failed to scan image. Please try again.');
      setStep('error');
      setProcessing(false);
    }
  };

  const handleStartEdit = (field, currentValue) => {
    setEditField(field);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = () => {
    setExtracted(prev => ({ ...prev, [editField]: editValue }));
    setEditField(null);
    setEditValue('');
  };

  const handleClose = () => {
    setStep('upload');
    setExtracted(null);
    setCreatedTasks([]);
    setError(null);
    setEditField(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onOpenChange(false);
  };

  const contentTypes = extracted?.content_types || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Scan Image</DialogTitle>
          <DialogDescription>
            Detects appointments, bills, and handwritten tasks automatically
          </DialogDescription>
        </DialogHeader>

        {/* Upload step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4" />
                Upload Photo
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
              <p className="font-medium text-foreground">What can be scanned:</p>
              <p>📅 Appointment reminders — imports date, time & name</p>
              <p>💳 Bills & invoices — imports due date & bill type</p>
              <p>✏️ Handwritten task lists — creates individual tasks</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
        )}

        {/* Scanning step */}
        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p>Analyzing image...</p>
            <p className="text-xs">Detecting appointments, bills, and tasks</p>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && extracted && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">{createdTasks.length} item{createdTasks.length !== 1 ? 's' : ''} added!</span>
            </div>

            {/* Appointment details */}
            {contentTypes.includes('appointment') && extracted.appointment && (
              <div className={`rounded-lg border p-3 space-y-2 ${TYPE_CONFIG.appointment.color}`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Appointment
                </div>
                <EditableField label="Name" value={extracted.appointment.name} fieldKey="appointment.name" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
                <EditableField label="Date" value={extracted.appointment.date} fieldKey="appointment.date" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
                <EditableField label="Time" value={extracted.appointment.time} fieldKey="appointment.time" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
                <EditableField label="Location" value={extracted.appointment.location} fieldKey="appointment.location" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
              </div>
            )}

            {/* Bill details */}
            {contentTypes.includes('bill') && extracted.bill && (
              <div className={`rounded-lg border p-3 space-y-2 ${TYPE_CONFIG.bill.color}`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                  <Receipt className="w-3.5 h-3.5" />
                  Bill
                </div>
                <EditableField label="Provider" value={extracted.bill.provider} fieldKey="bill.provider" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
                <EditableField label="Bill Type" value={extracted.bill.bill_type} fieldKey="bill.bill_type" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
                <EditableField label="Amount" value={extracted.bill.amount} fieldKey="bill.amount" editField={editField} editValue={editValue} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onEditChange={setEditValue} />
                {extracted.bill.due_day_of_month && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Due Day of Month</p>
                    <p className="font-semibold text-foreground text-sm">Day {extracted.bill.due_day_of_month}</p>
                  </div>
                )}
                {extracted.bill.due_date && !extracted.bill.due_day_of_month && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Due Date</p>
                    <p className="font-semibold text-foreground text-sm">{extracted.bill.due_date}</p>
                  </div>
                )}
              </div>
            )}

            {/* Handwritten tasks */}
            {contentTypes.includes('tasks') && extracted.tasks?.length > 0 && (
              <div className={`rounded-lg border p-3 space-y-1.5 ${TYPE_CONFIG.tasks.color}`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                  <ListChecks className="w-3.5 h-3.5" />
                  Tasks ({extracted.tasks.length})
                </div>
                {extracted.tasks.map((t, i) => (
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

        {/* Error step */}
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