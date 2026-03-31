import { View, Text, Button } from 'react-native';
import { useState } from 'react';
import { getDadosSaude } from './saudeService';

export default function Index() {
  const [dados, setDados] = useState<any>(null);

  const carregarDados = async () => {
    const dadosSaude = await getDadosSaude();
    setDados(dadosSaude);
  };

  return (
    <View style={{ 
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 20
    }}>
      
      <Text style={{ fontSize: 28, marginBottom: 20 }}>
        PsicoCare
      </Text>

      <Button 
        title="Carregar dados do relógio" 
        onPress={carregarDados} 
      />

      {dados && (
        <View style={{ marginTop: 30 }}>
          <Text>❤️ FC: {dados.frequenciaCardiaca} bpm</Text>
          <Text>📊 HRV: {dados.hrv} ms</Text>
          <Text>👟 Passos: {dados.passos}</Text>
          <Text>🌙 Sono: {dados.sono} horas</Text>
        </View>
      )}
    </View>
  );
}