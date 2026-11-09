import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Activity,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';

export const AuthScreen: React.FC = () => {
  const { login, loginDemo } = useHealthStore();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('daniel.vaz@gmail.com');
  const [password, setPassword] = useState<string>('••••••••');
  const [name, setName] = useState<string>('Daniel Vaz');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Branding e Logo */}
        <View style={styles.brandHeader}>
          <View style={styles.logoCircle}>
            <Activity color="#0D9488" size={32} />
          </View>
          <Text style={styles.appName}>Hub de Saúde Pessoal</Text>
          <Text style={styles.appTagline}>
            Do exame em papel de dez anos atrás aos sinais do seu relógio em tempo real.
          </Text>
          <View style={styles.tagBadge}>
            <Sparkles color="#0D9488" size={12} />
            <Text style={styles.tagBadgeText}>Desafio Rivio • Hackathon Gama House</Text>
          </View>
        </View>

        {/* Card do Formulário */}
        <View style={styles.authCard}>
          {/* Alternador Entrar / Cadastrar */}
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[styles.tabButton, !isRegister && styles.tabButtonActive]}
              onPress={() => setIsRegister(false)}
            >
              <Text style={[styles.tabButtonText, !isRegister && styles.tabButtonTextActive]}>
                Entrar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, isRegister && styles.tabButtonActive]}
              onPress={() => setIsRegister(true)}
            >
              <Text style={[styles.tabButtonText, isRegister && styles.tabButtonTextActive]}>
                Cadastrar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Campos do Formulário */}
          <View style={styles.formArea}>
            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <View style={styles.inputWrapper}>
                  <User color="#94A3B8" size={18} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Seu nome"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#94A3B8" size={18} />
                <TextInput
                  style={styles.textInput}
                  placeholder="seu.email@exemplo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#94A3B8" size={18} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Sua senha secreta"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff color="#94A3B8" size={18} />
                  ) : (
                    <Eye color="#94A3B8" size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Envio Padrão */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isRegister ? 'Criar Minha Conta' : 'Acessar Meu Hub de Saúde'}
                  </Text>
                  <ArrowRight color="#FFFFFF" size={16} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divisor */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU ACESSO DE PALCO</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botão de Acesso Demo 1-Toque (A Solução para Hackathon) */}
          <TouchableOpacity style={styles.demoLoginButton} onPress={loginDemo}>
            <View style={styles.demoBadge}>
              <CheckCircle2 color="#0D9488" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoLoginTitle}>
                ⚡ Entrar como Paciente Demo (Daniel, 32 anos)
              </Text>
              <Text style={styles.demoLoginSub}>
                5 anos de laudos Fleury/Dasa e Apple Watch pré-carregados para a demo.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Garantia de Privacidade */}
        <View style={styles.privacyFooter}>
          <ShieldCheck color="#64748B" size={14} />
          <Text style={styles.privacyText}>
            Dados criptografados de ponta a ponta. Arquitetura orientada ao Open Health.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 290,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  authCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0D9488',
  },
  formArea: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 6,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  demoLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#5EEAD4',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  demoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoLoginTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  demoLoginSub: {
    fontSize: 10,
    color: '#134E4A',
    marginTop: 2,
    lineHeight: 14,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    maxWidth: 300,
  },
  privacyText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
});
