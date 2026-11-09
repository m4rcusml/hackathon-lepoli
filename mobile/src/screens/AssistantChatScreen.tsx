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
  Info,
  ShieldCheck,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';

export const AssistantChatScreen: React.FC = () => {
  const { chatMessages, sendChatMessage } = useHealthStore();
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const quickPrompts = [
    'Por que sinto taquicardia e cansaço?',
    'Como está a evolução da minha glicose?',
    'Meu padrão de sono piorou recentemente?',
    'Gere um resumo executivo para meu médico',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    setInputText('');
    setIsSending(true);
    await sendChatMessage(text);
    setIsSending(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Bot color="#0D9488" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>Assistente de Saúde Pessoal</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>GraphRAG</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Respostas fundamentadas no seu histórico de exames e relógio
          </Text>
        </View>
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
            Este assistente cruza dados reais do seu histórico laboratorial e sinais do wearable para apoiar suas decisões e enriquecer sua consulta médica.
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

                {/* Fontes Citadas pelo GraphRAG */}
                {msg.citedSources && msg.citedSources.length > 0 && (
                  <View style={styles.sourcesBox}>
                    <Text style={styles.sourcesHeader}>Fontes Clínicas Citadas:</Text>
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
                  Consultando subgrafo e séries temporais...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sugestões de Perguntas Rápidas */}
      <View style={styles.promptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
          {quickPrompts.map((prompt, idx) => (
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

      {/* Barra de Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="Tire dúvidas sobre seus exames ou sinais vitais..."
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          editable={!isSending}
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 16,
    padding: 12,
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
  sourcesBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  sourcesHeader: {
    fontSize: 10,
    fontWeight: '700',
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
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 10,
    paddingHorizontal: 16,
    gap: 8,
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
