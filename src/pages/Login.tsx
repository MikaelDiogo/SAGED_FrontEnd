import { Box, Button, Text, Title, Stack, Image } from '@mantine/core';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export function Login() {
  const { isAuthenticated, signIn, loading } = useContext(AuthContext);

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <Box
      style={{
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack align="center" gap="xl">
        <Image src={logo} h={110} w="auto" fit="contain" />

        <Stack gap={5} align="center">
          <Title
            order={1}
            style={{
              fontSize: '42px',
              fontWeight: 900,
              color: '#004a29',
              letterSpacing: '-1.5px',
              lineHeight: 1,
            }}
          >
            SAGED
          </Title>
          <Box w={40} h={4} style={{ borderRadius: '2px', backgroundColor: '#00a859' }} />
          <Text c="dimmed" size="xs" fw={700} tt="uppercase" lts="1px" mt={5}>
            Gestão de Demandas
          </Text>
        </Stack>

        <Button
          size="lg"
          h={55}
          style={{
            backgroundColor: '#004a29',
            fontSize: '16px',
            fontWeight: 700,
            minWidth: 280,
          }}
          onClick={signIn}
        >
          Entrar com conta institucional
        </Button>

        <Text size="xs" c="gray.6" fw={800} lts="2px" tt="uppercase">
          Governo Municipal de Crateús
        </Text>
      </Stack>
    </Box>
  );
}
