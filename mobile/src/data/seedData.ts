import { BiomarkerDefinition, ExamMeasurement, UserProfile, WearableDailyReading } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr-dan-2026',
  name: 'Daniel Vaz',
  email: 'daniel.vaz@gmail.com',
  age: 32,
  biologicalSex: 'Masculino',
  chronicConditions: ['Histórico familiar de dislipidemia e arritmia'],
  activeMedications: ['Suplemento Vitamina D (2000 UI/dia)'],
};

export const BIOMARKER_DEFINITIONS: Record<string, BiomarkerDefinition> = {
  glicose: {
    id: 'glicose',
    canonicalName: 'Glicemia de Jejum',
    category: 'Glicêmico',
    unit: 'mg/dL',
    refMin: 70,
    refMax: 99,
    description: 'Nível de glicose plasmática em jejum de 8 a 12 horas.',
  },
  hba1c: {
    id: 'hba1c',
    canonicalName: 'Hemoglobina Glicada (HbA1c)',
    category: 'Glicêmico',
    unit: '%',
    refMin: 4.0,
    refMax: 5.6,
    description: 'Média ponderada da glicemia nos últimos 90 a 120 dias.',
  },
  ldl: {
    id: 'ldl',
    canonicalName: 'Colesterol LDL (Fração Ruim)',
    category: 'Lipídico',
    unit: 'mg/dL',
    refMin: 0,
    refMax: 130,
    description: 'Lipoproteína de baixa densidade associada ao risco aterosclerótico.',
  },
  hdl: {
    id: 'hdl',
    canonicalName: 'Colesterol HDL (Fração Boa)',
    category: 'Lipídico',
    unit: 'mg/dL',
    refMin: 40,
    refMax: 80,
    description: 'Lipoproteína protetora cardiovascular.',
  },
  triglicerides: {
    id: 'triglicerides',
    canonicalName: 'Triglicérides',
    category: 'Lipídico',
    unit: 'mg/dL',
    refMin: 0,
    refMax: 150,
    description: 'Gorduras de reserva energética e risco metabólico.',
  },
  ferritina: {
    id: 'ferritina',
    canonicalName: 'Ferritina Sérica',
    category: 'Hematológico',
    unit: 'ng/mL',
    refMin: 30,
    refMax: 400,
    description: 'Principal proteína de reserva de ferro do organismo.',
  },
  tsh: {
    id: 'tsh',
    canonicalName: 'TSH Ultra Sensível',
    category: 'Hormonal',
    unit: 'mUI/L',
    refMin: 0.4,
    refMax: 4.0,
    description: 'Hormônio tireoestimulante regulador da função da tireoide.',
  },
};

export const INITIAL_EXAMS: ExamMeasurement[] = [
  // Glicose ao longo de 5 anos
  {
    id: 'ex-glic-2022',
    date: '2022-03-15',
    labName: 'Fleury Medicina e Saúde',
    biomarkerId: 'glicose',
    canonicalName: 'Glicemia de Jejum',
    value: 84,
    unit: 'mg/dL',
    refMin: 70,
    refMax: 99,
    status: 'normal',
  },
  {
    id: 'ex-glic-2023',
    date: '2023-05-20',
    labName: 'Laboratório Salomão Zoppi',
    biomarkerId: 'glicose',
    canonicalName: 'Glicemia de Jejum',
    value: 89,
    unit: 'mg/dL',
    refMin: 70,
    refMax: 99,
    status: 'normal',
  },
  {
    id: 'ex-glic-2024',
    date: '2024-08-10',
    labName: 'Dasa / Alta Excelência',
    biomarkerId: 'glicose',
    canonicalName: 'Glicemia de Jejum',
    value: 94,
    unit: 'mg/dL',
    refMin: 70,
    refMax: 99,
    status: 'normal',
  },
  {
    id: 'ex-glic-2025',
    date: '2025-10-18',
    labName: 'Fleury Medicina e Saúde',
    biomarkerId: 'glicose',
    canonicalName: 'Glicemia de Jejum',
    value: 104,
    unit: 'mg/dL',
    refMin: 70,
    refMax: 99,
    status: 'attention',
    notes: 'Valor discretamente acima da faixa de normalidade.',
  },

  // Colesterol LDL
  {
    id: 'ex-ldl-2022',
    date: '2022-03-15',
    labName: 'Fleury Medicina e Saúde',
    biomarkerId: 'ldl',
    canonicalName: 'Colesterol LDL (Fração Ruim)',
    value: 112,
    unit: 'mg/dL',
    refMin: 0,
    refMax: 130,
    status: 'normal',
  },
  {
    id: 'ex-ldl-2023',
    date: '2023-05-20',
    labName: 'Laboratório Salomão Zoppi',
    biomarkerId: 'ldl',
    canonicalName: 'Colesterol LDL (Fração Ruim)',
    value: 128,
    unit: 'mg/dL',
    refMin: 0,
    refMax: 130,
    status: 'normal',
  },
  {
    id: 'ex-ldl-2024',
    date: '2024-08-10',
    labName: 'Dasa / Alta Excelência',
    biomarkerId: 'ldl',
    canonicalName: 'Colesterol LDL (Fração Ruim)',
    value: 142,
    unit: 'mg/dL',
    refMin: 0,
    refMax: 130,
    status: 'attention',
  },
  {
    id: 'ex-ldl-2025',
    date: '2025-10-18',
    labName: 'Fleury Medicina e Saúde',
    biomarkerId: 'ldl',
    canonicalName: 'Colesterol LDL (Fração Ruim)',
    value: 156,
    unit: 'mg/dL',
    refMin: 0,
    refMax: 130,
    status: 'critical',
    notes: 'Tendência de elevação sustentada nos últimos 3 anos.',
  },

  // Ferritina
  {
    id: 'ex-fer-2023',
    date: '2023-05-20',
    labName: 'Laboratório Salomão Zoppi',
    biomarkerId: 'ferritina',
    canonicalName: 'Ferritina Sérica',
    value: 65,
    unit: 'ng/mL',
    refMin: 30,
    refMax: 400,
    status: 'normal',
  },
  {
    id: 'ex-fer-2025',
    date: '2025-10-18',
    labName: 'Fleury Medicina e Saúde',
    biomarkerId: 'ferritina',
    canonicalName: 'Ferritina Sérica',
    value: 22,
    unit: 'ng/mL',
    refMin: 30,
    refMax: 400,
    status: 'attention',
    notes: 'Queda acentuada. Compatível com queixa recente de fadiga.',
  },

  // TSH
  {
    id: 'ex-tsh-2024',
    date: '2024-08-10',
    labName: 'Dasa / Alta Excelência',
    biomarkerId: 'tsh',
    canonicalName: 'TSH Ultra Sensível',
    value: 2.1,
    unit: 'mUI/L',
    refMin: 0.4,
    refMax: 4.0,
    status: 'normal',
  },
  {
    id: 'ex-tsh-2025',
    date: '2025-10-18',
    labName: 'Fleury Medicina e Saúde',
    biomarkerId: 'tsh',
    canonicalName: 'TSH Ultra Sensível',
    value: 2.4,
    unit: 'mUI/L',
    refMin: 0.4,
    refMax: 4.0,
    status: 'normal',
  },
];

export function generateBaselineWearables(): WearableDailyReading[] {
  const readings: WearableDailyReading[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Variabilidade natural leve
    const randomShift = (Math.sin(i * 0.4) * 3);
    const bpm = Math.round(62 + randomShift);
    const hrv = Math.round(56 - randomShift * 1.5);
    const sleep = Number((7.2 + Math.cos(i * 0.3) * 0.5).toFixed(1));
    const deepSleep = Number((1.8 + Math.sin(i * 0.5) * 0.3).toFixed(1));
    const remSleep = Number((1.7 + Math.cos(i * 0.2) * 0.2).toFixed(1));

    readings.push({
      date: dateStr,
      restingHeartRate: bpm,
      maxHeartRate: bpm + 55,
      minHeartRate: bpm - 12,
      hrv,
      sleepHours: sleep,
      deepSleepHours: deepSleep,
      remSleepHours: remSleep,
      spo2: 98,
      steps: Math.round(8200 + Math.random() * 2500),
    });
  }

  return readings;
}
