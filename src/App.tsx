import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './contexts/AuthProvider';
import { UnitProvider } from './contexts/UnitContext';
import { AppRoutes } from './routes/AppRoutes';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'; // Não esqueça do CSS das notificações!

const theme = createTheme({
  colors: {
    'crateus-green': [
      '#eef9ec', '#e0f0dc', '#bedeb7', '#99cb8f', '#79bb6d', 
      '#64b156', '#59ad4a', '#4a983d', '#3d8734', '#1D720A'
    ],
  },
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  primaryColor: 'crateus-green',
  primaryShade: 9,
});

export default function App() {
  return (
    // O AuthProvider deve envolver a aplicação para que as rotas saibam quem está logado
    <AuthProvider>
      <UnitProvider>
        <MantineProvider theme={theme}>
          <Notifications />
          <AppRoutes />
        </MantineProvider>
      </UnitProvider>
    </AuthProvider>
  );
}