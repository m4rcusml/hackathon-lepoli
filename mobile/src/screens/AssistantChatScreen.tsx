import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileCheck,
  Watch,
  ShieldCheck,
  Mic,
  MicOff,
  Pill,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';

export const AssistantChatScreen: React.FC = () => {
  const { chatMessages, sendChatMessage, isSimulatedAnomalyActive } = useHealthStore();
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = [
    { id: 'Todos', label: 'Tudo', icon: Sparkles },
    { id: 'Alertas', label: 'Alertas Ativos', icon: AlertTriangle },
    { id: 'Exames', label: 'Exames de Sangue', icon: FileCheck },
    { id: 'Wearables', label: 'Sinais Vitais', icon: HeartPulse },
    { id: 'Remedios', label: 'Medicações', icon: Pill },
  ];

  const quickPromptsByCategory: Record<string, string[]> = {
    Todos: [
      'Por que sinto taquicardia e cansaço?',
      'Como está a evolução da minha glicose?',
      'Meu sono profundo piorou recentemente?',
      'Gere um resumo para levar na consulta médica',
    ],
    Alertas: [
      'Explique o episódio de taquicardia das 03:15',
      'Minha arritmia noturna é perigosa?',
      'O que fazer diante do alerta de HRV baixo?',
    ],
    Exames: [
      'Por que minha ferritina caiu em 2025?',
      'O que significa minha glicemia estar em 104?',
      'Quais exames estão fora da faixa de normalidade?',
    ],
    Wearables: [
      'Qual é minha frequência cardíaca de repouso?',
      'Quantas horas de sono profundo tive esta semana?',
      'Minha saturação SpO2 está boa?',
    ],
    Remedios: [
      'Meu suplemento de Vitamina D interfere na glicemia?',
      'Existe interação entre meus laudos e remédios?',
    ],
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    setInputText('');
    setIsSending(true);
    await sendChatMessage(text);
    setIsSending(false);
  };

  const handleSimulateVoiceInput = () => {
    setIsRecordingAudio(true);
    setTimeout(() => {
      setIsRecordingAudio(false);
      handleSend('Estou sentindo palpitações no peito ao acordar e muito cansaço físico.');
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Bot color="#0D9488" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>Assistente Clínico Pessoal</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Hybrid GraphRAG</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Ancorado nos laudos de 2022-2026 e nos sinais vitais do Apple Watch
          </Text>
        </View>
      </View>

      {/* Categorias de Navegação Rápida (ETAPA 5) */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <IconComponent size={12} color={isSelected ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Mensagens do Chat */}
      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.disclaimerBox}>
          <ShieldCheck color="#0D9488" size={16} />
          <Text style={styles.disclaimerText}>
            Contexto ativado: o assistente correlaciona seus laudos laboratoriais, medicamentos em uso e leituras em repouso dos wearables.
          </Text>
        </View>

        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {!isUser && (
                <View style={styles.avatarMini}>
                  <Bot color="#0D9488" size={14} />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.messageTextUser : styles.messageTextAssistant,
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Mini-Widgets Clínicos Embutidos (ETAPA 5) */}
                {!isUser && isSimulatedAnomalyActive && msg.text.includes('taquicardia') && (
                  <View style={styles.widgetCard}>
                    <View style={styles.widgetHeader}>
                      <AlertTriangle color="#E11D48" size={14} />
                      <Text style={styles.widgetTitle}>Detecção no Apple Watch: 114 BPM</Text>
                    </View>
                    <Text style={styles.widgetDesc}>
                      Episódio às 03:15 da madrugada associado a Ferritina Sérica de 22 ng/mL (Abaixo da ref. 30-400).
                    </Text>
                  </View>
                )}

                {/* Fontes Citadas pelo GraphRAG */}
                {msg.citedSources && msg.citedSources.length > 0 && (
                  <View style={styles.sourcesBox}>
                    <Text style={styles.sourcesHeader}>Evidências do Grafo Clínico:</Text>
                    {msg.citedSources.map((src, i) => (
                      <View key={i} style={styles.sourceItem}>
                        {src.sourceType === 'wearable' ? (
                          <Watch size={12} color="#0D9488" />
                        ) : (
                          <FileCheck size={12} color="#3B82F6" />
                        )}
                        <Text style={styles.sourceText}>
                          <Text style={{ fontWeight: '700' }}>{src.title}</Text> ({src.date})
                          {src.value ? `: ${src.value}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.timestampText}>{msg.timestamp}</Text>
              </View>

              {isUser && (
                <View style={[styles.avatarMini, { backgroundColor: '#E2E8F0' }]}>
                  <User color="#475569" size={14} />
                </View>
              )}
            </View>
          );
        })}

        {isSending && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={styles.avatarMini}>
              <Bot color="#0D9488" size={14} />
            </View>
            <View style={[styles.messageBubble, styles.bubbleAssistant]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#0D9488" />
                <Text style={styles.typingText}>
                  Recuperando nós do grafo e calculando correlação...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Simulação de Gravação de Áudio com Waveform */}
        {isRecordingAudio && (
          <View style={styles.audioRecordingCard}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Gravando sintoma por voz com IA...</Text>
            <View style={styles.waveformSimulation}>
              {[12, 24, 18, 30, 16, 28, 14, 22].map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h }]} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sugestões de Perguntas Rápidas */}
      <View style={styles.promptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
          {(quickPromptsByCategory[selectedCategory] || quickPromptsByCategory['Todos']).map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSend(prompt)}
              disabled={isSending}
            >
              <Sparkles color="#0D9488" size={12} />
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Barra de Input com Botão de Voz */}
      <View style={styles.inputArea}>
        <TouchableOpacity
          style={[styles.micButton, isRecordingAudio && styles.micButtonActive]}
          onPress={handleSimulateVoiceInput}
          disabled={isSending}
        >
          {isRecordingAudio ? <MicOff color="#FFFFFF" size={18} /> : <Mic color="#0D9488" size={18} />}
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Pergunte sobre seus exames, sono ou coração..."
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          editable={!isSending && !isRecordingAudio}
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isSending}
        >
          <Send color="#FFFFFF" size={16} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  activePill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  categoriesBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 6,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  categoryChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0F766E',
  },
  categoryChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#134E4A',
    lineHeight: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 14,
  },
  bubbleUser: {
    backgroundColor: '#0D9488',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAssistant: {
    color: '#1E293B',
  },
  widgetCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  widgetTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
  },
  widgetDesc: {
    fontSize: 10,
    color: '#881337',
    lineHeight: 14,
  },
  sourcesBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  sourcesHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceText: {
    fontSize: 11,
    color: '#475569',
  },
  timestampText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  audioRecordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E11D48',
  },
  recordingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
    flex: 1,
  },
  waveformSimulation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#E11D48',
    borderRadius: 2,
  },
  promptsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  promptsScroll: {
    paddingHorizontal: 12,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    gap: 6,
  },
  promptChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#E11D48',
    borderColor: '#BE123C',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
