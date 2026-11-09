export type BiologicalSex = 'Masculino' | 'Feminino';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  biologicalSex: BiologicalSex;
  chronicConditions?: string[];
  activeMedications?: string[];
  avatarUrl?: string;
}

export type BiomarkerCategory = 'Glicêmico' | 'Lipídico' | 'Hormonal' | 'Hematológico' | 'Inflamatório';

export interface BiomarkerDefinition {
  id: string;
  canonicalName: string;
  category: BiomarkerCategory;
  unit: string;
  refMin: number;
  refMax: number;
  description: string;
}

export interface ExamMeasurement {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  labName: string;
  biomarkerId: string;
  canonicalName: string;
  value: number;
  unit: string;
  refMin: number;
  refMax: number;
  status: 'normal' | 'attention' | 'critical';
  notes?: string;
  documentId?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
  extractedCount: number;
  status: 'processed' | 'processing' | 'error';
}

export interface WearableDailyReading {
  date: string; // YYYY-MM-DD
  restingHeartRate: number; // BPM
  maxHeartRate: number;
  minHeartRate: number;
  hrv: number; // ms (Heart Rate Variability)
  sleepHours: number;
  deepSleepHours: number;
  remSleepHours: number;
  spo2: number; // %
  steps: number;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  metricType: 'heart_rate' | 'hrv' | 'sleep' | 'spo2';
  valueDetected: string;
  baselineValue: string;
  clinicalContext: string;
  resolved: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citedSources?: Array<{
    title: string;
    date: string;
    value?: string;
    sourceType: 'lab_exam' | 'wearable' | 'prescription';
  }>;
}

export interface DoctorAccessSession {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  accessUrl: string;
  active: boolean;
  scope: string[];
}
