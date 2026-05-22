import { 
  Paper, TextInput, PasswordInput, Button, Title, 
  Text, Container, Stack, Image, Center, Box 
} from '@mantine/core';
import { IconLock, IconAt } from '@tabler/icons-react';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { AuthContext } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export function Login() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth) throw new Error("Contexto de autenticação não carregado");
      
      // O cookie HTTPOnly será injetado automaticamente pelo navegador aqui
      await auth.signIn({ email, password });

      notifications.show({
        title: 'Bem-vindo ao SAGED',
        message: 'Acesso autorizado com sucesso!',
        color: 'green',
      });

      // Buscamos o usuário atualizado do localStorage após o contexto salvar
      const role = auth.user?.role?.trim().toUpperCase();

      // Redirecionamento baseado no nível de privilégio (RBAC)
      if (role === 'ADMIN_GERAL') {
        navigate('/selecionar-unidade');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Falha no acesso',
        message: 'E-mail ou senha incorretos. Verifique suas credenciais.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size={450} my={40} w="100%">
        <Center mb={40}>
          <Image src={logo} h={110} w="auto" fit="contain" />
        </Center>

        <Paper withBorder shadow="md" p={45} radius="sm" bg="white">
          <Stack gap={5} mb={40} align="center">
            <Title order={1} style={{ fontSize: '42px', fontWeight: 900, color: '#004a29', letterSpacing: '-1.5px', lineHeight: 1 }}>
              SAGED
            </Title>
            <Box w={40} h={4} style={{ borderRadius: '2px', backgroundColor: '#00a859' }} />
            <Text c="dimmed" size="xs" fw={700} tt="uppercase" lts="1px" mt={5}>
              Gestão de Demandas
            </Text>
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack gap="lg">
              <TextInput 
                label="E-mail Institucional" 
                placeholder="seu@email.com" 
                required 
                size="md"
                leftSection={<IconAt size={18} />}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />

              <PasswordInput 
                label="Senha de Accesso" 
                placeholder="Sua senha" 
                required 
                size="md"
                leftSection={<IconLock size={18} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />

              <Button 
                fullWidth 
                mt="xl" 
                type="submit" 
                size="lg"
                h={55}
                loading={loading}
                style={{ backgroundColor: '#004a29', fontSize: '16px', fontWeight: 700 }}
              >
                Acessar Plataforma
              </Button>
            </Stack>
          </form>

          <Center mt="xl">
            <Text size="xs" c="dimmed">
              Problemas com acesso? <Text span fw={700} c="green.9" style={{ cursor: 'pointer' }}>Contatar TI</Text>
            </Text>
          </Center>
        </Paper>

        <Box ta="center" mt={40}>
          <Text size="xs" c="gray.6" fw={800} lts="2px" tt="uppercase">
            Governo Municipal de Crateús
          </Text>
        </Box>
      </Container>
    </Box>
  );
}