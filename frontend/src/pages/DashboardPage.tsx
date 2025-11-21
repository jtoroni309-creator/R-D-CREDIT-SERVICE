import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
} from '@mui/material';
import { Add, TrendingUp, Folder, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { engagementService } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: engagementsData } = useQuery({
    queryKey: ['engagements', { limit: 5 }],
    queryFn: () => engagementService.list({ limit: 5 }),
  });

  const engagements = engagementsData?.data?.engagements || [];

  const stats = [
    {
      title: 'Total Engagements',
      value: engagementsData?.data?.pagination?.total || 0,
      icon: <Folder sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Active Projects',
      value: engagements.reduce(
        (sum: number, e: any) => sum + (e.projects?.length || 0),
        0
      ),
      icon: <Assessment sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Credits Calculated',
      value: '$0',
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/engagements')}
        >
          New Engagement
        </Button>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>{stat.icon}</Box>
                  <Typography variant="h6">{stat.title}</Typography>
                </Box>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Engagements
        </Typography>
        <Grid container spacing={2}>
          {engagements.map((engagement: any) => (
            <Grid item xs={12} key={engagement.id}>
              <Card
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/engagements/${engagement.id}`)}
              >
                <CardContent>
                  <Typography variant="h6">{engagement.taxpayerName}</Typography>
                  <Typography color="text.secondary">
                    Tax Year {engagement.taxYear} • Status: {engagement.status}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {engagement.projects?.length || 0} projects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
