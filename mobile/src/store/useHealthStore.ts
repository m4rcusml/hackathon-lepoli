import { create } from 'zustand';
import {
  AnomalyAlert,
  BiomarkerDefinition,
  ChatMessage,
  DoctorAccessSession,
  ExamMeasurement,
  UserProfile,
  WearableDailyReading,
} from '../types';
import {
  BIOMARKER_DEFINITIONS,
  generateBaselineWearables,
  INITIAL_EXAMS,
  INITIAL_USER,
} from '../data/seedData';

interface HealthState {
  user: UserProfile;
  biomarkers: Record<string, BiomarkerDefinition>;
  exams: ExamMeasurement[];
  wearables: WearableDailyReading[];
  activeAlerts: AnomalyAlert[];
  chatMessages: ChatMessage[];
  doctorSession: DoctorAccessSession | null;
  isSimulatedAnomalyActive: boolean;

  // Actions
  addExamMeasurement: (exam: Omit<ExamMeasurement, 'id'>) => void;
  processExamDocumentMock: (docName: string) => Promise<ExamMeasurement[]>;
  injectWearableAnomalyScenario: () => void;
  resetWearableScenario: () => void;
  sendChatMessage: (userText: string) => Promise<void>;
  generateDoctorAccessSession: () => DoctorAccessSession;
  revokeDoctorAccessSession: () => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  user: INITIAL_USER,
  biomarkers: BIOMARKER_DEFINITIONS,
  exams: INITIAL_EXAMS,
  wearables: generateBaselineWearables(),
  activeAlerts: [],
  isSimulatedAnomalyActive: false,
  doctorSession: {
    id: 'sess-init-01',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItZGFuLTIwMjYiLCJyb2xlIjoibWVkaWNhbF9jb25zdWx0YXRpb24iLCJleHAiOjE4MDAwMDAwMDB9.sig',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    accessUrl: 'https://lepoli-health.app/doctor/consultation/token_dan_openhealth_2026',
    active: true,
    scope: ['read_exams', 'read_wearables', 'read_graphrag_briefing'],
  },
  chatMessages: [
    {
      id: 'msg-0',
      sender: 'assistant',
      text: 'Olá, Daniel! Sou seu assistente do Hub de Saúde Pessoal. Acompanho seus laudos laboratoriais desde 2022 e seus sinais vitais contínuos do Apple Watch. Como posso te ajudar hoje?',
      timestamp: 'Hoje, 09:15',
    },
  ],

  addExamMeasurement: (newExam) => {
    const examWithId: ExamMeasurement = {
      ...newExam,
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    set((state) => ({
      exams: [examWithId, ...state.exams],
    }));
  },

  processExamDocumentMock: async (docName: string) => {
    // Simula o tempo de latência da leitura multimodal do Gemini com Structured Output
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const todayStr = new Date().toISOString().split('T')[0];
    const newItems: ExamMeasurement[] = [
      {
        id: `ex-gen-${Date.now()}-1`,
        date: todayStr,
        labName: 'Fleury Medicina e Saúde',
        biomarkerId: 'glicose',
        canonicalName: 'Glicemia de Jejum',
        value: 108,
        unit: 'mg/dL',
        refMin: 70,
        refMax: 99,
        status: 'attention',
        notes: 'Identificado no laudo anexado: "' + docName + '".',
      },
      {
        id: `ex-gen-${Date.now()}-2`,
        date: todayStr,
        labName: 'Fleury Medicina e Saúde',
        biomarkerId: 'hba1c',
        canonicalName: 'Hemoglobina Glicada (HbA1c)',
        value: 5.8,
        unit: '%',
        refMin: 4.0,
        refMax: 5.6,
        status: 'attention',
        notes: 'Extraído automaticamente com Structured JSON via Gemini.',
      },
    ];

    set((state) => ({
      exams: [...newItems, ...state.exams],
    }));

    return newItems;
  },

  injectWearableAnomalyScenario: () => {
    const currentWearables = [...get().wearables];
    // Altera os últimos 3 dias para simular taquicardia noturna, queda de sono profundo e queda drástica de HRV
    const modifiedWearables = currentWearables.map((item, index) => {
      if (index >= currentWearables.length - 3) {
        return {
          ...item,
          restingHeartRate: 106 + (index % 3) * 4, // 106 - 114 BPM em repouso
          maxHeartRate: 158,
          hrv: 22 - index * 2, // Despenca para 18-22ms
          sleepHours: 5.1,
          deepSleepHours: 0.3, // Sono profundo quase nulo
          remSleepHours: 0.8,
        };
      }
      return item;
    });

    const newAlert: AnomalyAlert = {
      id: `alert-taqui-${Date.now()}`,
      timestamp: 'Hoje às 03:22 (Madrugada)',
      title: 'Padrão Cardíaco Anômalo em Repouso',
      description: 'Identificados 3 episódios de frequência cardíaca sustentada acima de 108 BPM durante o sono, com queda de 62% na variabilidade cardíaca (HRV).',
      severity: 'high',
      metricType: 'heart_rate',
      valueDetected: '112 BPM (Repouso noturno)',
      baselineValue: '62 BPM (Seu habitual)',
      clinicalContext: 'O padrão coincide com relatos de fadiga e queda de ferritina no laudo recente. Recomendado acompanhamento cardiológico.',
      resolved: false,
    };

    set({
      wearables: modifiedWearables,
      activeAlerts: [newAlert],
      isSimulatedAnomalyActive: true,
    });
  },

  resetWearableScenario: () => {
    set({
      wearables: generateBaselineWearables(),
      activeAlerts: [],
      isSimulatedAnomalyActive: false,
    });
  },

  sendChatMessage: async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Agora',
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
    }));

    // Simula latência de resposta do motor GraphRAG
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const state = get();
    const lower = userText.toLowerCase();

    let botResponse = '';
    const citedSources: ChatMessage['citedSources'] = [];

    if (lower.includes('taquicardia') || lower.includes('coração') || lower.includes('arritmia') || lower.includes('batedeira')) {
      botResponse = state.isSimulatedAnomalyActive
        ? 'Detectei nos registros do seu Apple Watch que você teve 3 picos de frequência cardíaca em repouso (atingindo até 114 BPM) durante o sono entre 02:40 e 04:15. Cruzando com seu histórico, seu exame de Ferritina mais recente (22 ng/mL) está abaixo da referência, o que pode agravar sintomas de taquicardia reflexa e cansaço. Recomendo gerar um acesso via QR Code para seu cardiologista avaliar a curva completa.'
        : 'Sua frequência cardíaca basal está estável na média de 62 BPM nos últimos 30 dias, sem episódios anômalos detectados pelo seu relógio. Se você estiver sentindo palpitações ou desconforto, é prudente registrar o momento ou consultar seu médico.';

      if (state.isSimulatedAnomalyActive) {
        citedSources.push({
          title: 'Apple Watch - Alerta de BPM Noturno',
          date: 'Últimas 72h',
          value: '108-114 BPM em repouso',
          sourceType: 'wearable',
        });
        citedSources.push({
          title: 'Exame de Ferritina Sérica (Fleury)',
          date: '18/10/2025',
          value: '22 ng/mL (Ref: 30-400)',
          sourceType: 'lab_exam',
        });
      }
    } else if (lower.includes('glicose') || lower.includes('glicemia') || lower.includes('açúcar')) {
      const recentGlic = state.exams.find((e) => e.biomarkerId === 'glicose');
      botResponse = `Sua Glicemia de Jejum mais recente foi de ${recentGlic?.value || 104} mg/dL (${recentGlic?.labName}, em ${recentGlic?.date}). Observando a sua linha do tempo de 2022 a 2025, houve uma tendência gradual de elevação (84 -> 89 -> 94 -> 104 mg/dL), ultrapassando a faixa ideal de normalidade (máx 99 mg/dL). Vale conversar com seu médico sobre ajustes na dieta e acompanhamento da hemoglobina glicada.`;
      citedSources.push({
        title: 'Histórico de Glicemia (2022 - 2025)',
        date: recentGlic?.date || '2025',
        value: `${recentGlic?.value} mg/dL`,
        sourceType: 'lab_exam',
      });
    } else if (lower.includes('sono') || lower.includes('cansado') || lower.includes('fadiga')) {
      botResponse = state.isSimulatedAnomalyActive
        ? 'Nos últimos 3 dias, seu tempo de sono profundo caiu de 1.8h para apenas 0.3h por noite, com elevação da frequência cardíaca noturna. Isso explica a sensação de cansaço extremo. Além disso, seu exame de Ferritina de outubro de 2025 registrou 22 ng/mL (abaixo da faixa normal de 30-400), o que reduz o transporte eficiente de oxigênio.'
        : 'Seu padrão de sono habitual registra média de 7.2h por noite, com 1.8h de sono profundo (ótimo índice de reparação). Caso esteja sentindo fadiga, vale checar a evolução de vitaminas e ferritina no próximo check-up.';

      citedSources.push({
        title: 'Monitoramento de Sono (Wearable)',
        date: 'Últimos 7 dias',
        value: state.isSimulatedAnomalyActive ? '0.3h sono profundo' : '1.8h sono profundo',
        sourceType: 'wearable',
      });
    } else {
      botResponse = `Com base no seu perfil clínico e nos laudos unificados: você possui exames registrados de Glicemia, Perfil Lipídico, TSH e Ferritina, além de ${state.wearables.length} dias de monitoramento de sinais vitais contínuos. Posso analisar correlações específicas se você quiser perguntar sobre seus exames de sangue, batimentos cardíacos ou qualidade do sono.`;
      citedSources.push({
        title: 'Grafo de Saúde Pessoal',
        date: 'Atualizado hoje',
        value: `${state.exams.length} aferições laboratoriais`,
        sourceType: 'lab_exam',
      });
    }

    const assistantMsg: ChatMessage = {
      id: `msg-ast-${Date.now()}`,
      sender: 'assistant',
      text: botResponse,
      timestamp: 'Agora',
      citedSources,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, assistantMsg],
    }));
  },

  generateDoctorAccessSession: () => {
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const token = `token_lepoli_${Date.now()}_openhealth_secure`;
    const newSession: DoctorAccessSession = {
      id: `sess-${Date.now()}`,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expires,
      accessUrl: `https://lepoli-health.app/doctor/consultation/${token}`,
      active: true,
      scope: ['read_exams', 'read_wearables', 'read_graphrag_briefing'],
    };

    set({ doctorSession: newSession });
    return newSession;
  },

  revokeDoctorAccessSession: () => {
    set({ doctorSession: null });
  },
}));
