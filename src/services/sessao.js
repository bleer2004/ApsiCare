import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIAS_PACIENTE = ['lembrete'];

export async function lerSessao() {
  try {
    const [token, userStr] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('user'),
    ]);
    const user = userStr ? JSON.parse(userStr) : null;
    if (!token || !user?.id) return null;
    if (user.type === 'CLINICIAN') return { user, home: 'VisaoGeral' };
    if (user.type === 'PATIENT') return { user, home: 'HomePaciente' };
    return null;
  } catch {
    return null;
  }
}

export function rotaDaNotificacao(data, sessao) {
  if (!data?.category || !sessao) return null;
  const paraPaciente = CATEGORIAS_PACIENTE.includes(data.category);
  if (paraPaciente && sessao.home === 'HomePaciente') {
    return { name: 'HomePaciente', params: { abrirNotificacoes: true } };
  }
  if (!paraPaciente && sessao.home === 'VisaoGeral') {
    return { name: 'NotificacoesPsicologo' };
  }
  return null;
}
