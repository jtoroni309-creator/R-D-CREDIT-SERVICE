import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Add, Calculate, Assessment } from '@mui/icons-material';
import { engagementService, projectService } from '../services/api';
import { useState } from 'react';

export default function EngagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const { data: engagementData } = useQuery({
    queryKey: ['engagement', id],
    queryFn: () => engagementService.get(id!),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.listByEngagement(id!),
  });

  const engagement = engagementData?.data;
  const projects = projectsData?.data || [];

  if (!engagement) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">{engagement.taxpayerName}</Typography>
          <Typography color="text.secondary">
            Tax Year {engagement.taxYear} • EIN: {engagement.taxpayerEIN}
          </Typography>
        </Box>
        <Chip label={engagement.status} color="primary" />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Projects
              </Typography>
              <Typography variant="h4">{projects.length}</Typography>
              <Button
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => navigate(`/engagements/${id}/projects/new`)}
              >
                Add Project
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                QRE Data
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/engagements/${id}/qre`)}
                sx={{ mt: 2 }}
              >
                Manage QREs
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calculations
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Calculate />}
                onClick={() => navigate(`/engagements/${id}/calculations`)}
                sx={{ mt: 2 }}
              >
                Calculate Credits
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Projects" />
          <Tab label="Details" />
        </Tabs>
        <CardContent>
          {currentTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                R&D Projects
              </Typography>
              <Grid container spacing={2}>
                {projects.map((project: any) => (
                  <Grid item xs={12} md={6} key={project.id}>
                    <Card
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <CardContent>
                        <Typography variant="h6">{project.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.description}
                        </Typography>
                        <Chip
                          label={
                            project.isValidated ? 'Validated' : 'Not Validated'
                          }
                          color={project.isValidated ? 'success' : 'warning'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Engagement Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography>{engagement.taxpayerAddress}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Selected States
                  </Typography>
                  <Typography>
                    {engagement.selectedStates.join(', ') || 'None'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Assessment />}
          onClick={() => navigate(`/engagements/${id}/reports`)}
        >
          Generate Reports
        </Button>
      </Box>
    </Box>
  );
}
