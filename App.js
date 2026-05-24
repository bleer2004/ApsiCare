import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Tela de seleção de ambiente
import AmbienteTeste from './src/screens/ambienteTeste';

// Telas do Psicólogo
import LoginSignedUp from './src/screens/loginSignedUp';
import Cadastro from './src/screens/signUpForm/cadastro';
import RecuperarSenha from './src/screens/setUpPassword/recuperarSenha';
import VisaoGeral from './src/screens/visionBoard/visaoGeral';
import Pacientes from './src/screens/allVision/pacientes';
import DashboardPaciente from './src/screens/userPorfile/perfilUsuario';
import CadastroPaciente from './src/screens/userSignUp/cadastroPaciente';
import Configuracoes from './src/screens/Configs/configuracoes';
import Relatorios from './src/screens/Files/RelatoriosPsicologo';

// Telas do Paciente
import LoginPaciente from './paciente/src/screens/LoginPaciente';
import HomePaciente from './paciente/src/screens/HomePaciente';
import MetasPaciente from './paciente/src/screens/MetasPaciente';
import DiarioPaciente from './paciente/src/screens/DiarioPaciente';
import PerfilPaciente from './paciente/src/screens/perfilPaciente';
import RecuperarSenhaPaciente from './paciente/src/screens/RecuperarSenhaPaciente';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AmbienteTeste">

        {/* Tela de seleção */}
        <Stack.Screen name="AmbienteTeste" component={AmbienteTeste} options={{ headerShown: false }} />

        {/* Telas do Psicólogo */}
        <Stack.Screen name="LoginSignedUp" component={LoginSignedUp} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={Cadastro} options={{ headerShown: false }} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenha} options={{ headerShown: false }} />
        <Stack.Screen name="VisaoGeral" component={VisaoGeral} options={{ headerShown: false }} />
        <Stack.Screen name="Pacientes" component={Pacientes} options={{ headerShown: false }} />
        <Stack.Screen name="DashboardPaciente" component={DashboardPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="CadastroPaciente" component={CadastroPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="Configuracoes" component={Configuracoes} options={{ headerShown: false }} />
        <Stack.Screen name="Relatorios" component={Relatorios} options={{ headerShown: false }} />

        {/* Telas do Paciente */}
        <Stack.Screen name="LoginPaciente" component={LoginPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="HomePaciente" component={HomePaciente} options={{ headerShown: false }} />
        <Stack.Screen name="MetasPaciente" component={MetasPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="DiarioPaciente" component={DiarioPaciente} options={{ headerShown: false }} />
        <Stack.Screen name="PerfilPaciente" component={PerfilPaciente} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}