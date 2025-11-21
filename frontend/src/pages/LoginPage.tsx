import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    // Handle OAuth callback
    const code = searchParams.get('code');
    if (code) {
      handleCallback(code);
    }
  }, [isAuthenticated, searchParams]);

  const handleCallback = async (code: string) => {
    try {
      const response = await authService.handleCallback(code);
      const { tokens } = response.data;
      login(tokens.accessToken, tokens.refreshToken);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleShareFileLogin = async () => {
    try {
      const response = await authService.initiateShareFileLogin();
      const { authUrl } = response.data;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate login:', error);
      alert('Failed to start login process.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ minWidth: 400, mt: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
            >
              R&D Tax Credit Application
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              Sign in with your ShareFile account to access the R&D credit study platform.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleShareFileLogin}
              >
                Sign in with ShareFile
              </Button>
            </Box>
            <Typography
              variant="caption"
              display="block"
              align="center"
              sx={{ mt: 3 }}
              color="text.secondary"
            >
              This application is integrated with ShareFile for secure document management and collaboration.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
