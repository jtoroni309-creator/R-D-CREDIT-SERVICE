import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import { Save, AutoAwesome } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { projectService, llmService } from '../services/api';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [llmImproved, setLlmImproved] = useState<string | null>(null);
  const [llmDisclaimer, setLlmDisclaimer] = useState<string | null>(null);

  const { data: projectData } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id!),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      alert('Project updated successfully!');
    },
  });

  const improveMutation = useMutation({
    mutationFn: (text: string) => llmService.improveNarrative(text),
    onSuccess: (response) => {
      const { improved, disclaimer } = response.data;
      setLlmImproved(improved);
      setLlmDisclaimer(disclaimer);
    },
  });

  const project = projectData?.data;

  useEffect(() => {
    if (project) {
      setFormData(project);
    }
  }, [project]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleImproveNarrative = () => {
    if (formData.description) {
      improveMutation.mutate(formData.description);
    }
  };

  const handleAcceptImproved = () => {
    setFormData({ ...formData, narrativeImproved: llmImproved });
    setLlmImproved(null);
  };

  if (!project) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {project.name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Information
              </Typography>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Business Component"
                value={formData.businessComponent || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessComponent: e.target.value,
                  })
                }
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Technologies Used (comma-separated)"
                value={formData.technologiesUsed?.join(', ') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    technologiesUsed: e.target.value
                      .split(',')
                      .map((t) => t.trim()),
                  })
                }
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Typography variant="h6">Project Narrative</Typography>
                <Button
                  size="small"
                  startIcon={<AutoAwesome />}
                  onClick={handleImproveNarrative}
                  disabled={improveMutation.isPending}
                >
                  AI Improve
                </Button>
              </Box>

              {llmDisclaimer && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {llmDisclaimer}
                </Alert>
              )}

              {llmImproved && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    AI-Improved Version:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {llmImproved}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAcceptImproved}
                  >
                    Accept
                  </Button>
                </Box>
              )}

              <TextField
                fullWidth
                label="Approved Narrative"
                value={formData.narrativeImproved || formData.narrativeOriginal || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    narrativeImproved: e.target.value,
                  })
                }
                multiline
                rows={6}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                4-Part Test
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                1. Permitted Purpose
              </Typography>
              <TextField
                fullWidth
                label="Is this for a new or improved business component?"
                multiline
                rows={3}
                value={
                  formData.permittedPurpose?.question1 || ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permittedPurpose: {
                      ...formData.permittedPurpose,
                      question1: e.target.value,
                    },
                  })
                }
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                2. Elimination of Uncertainty
              </Typography>
              <TextField
                fullWidth
                label="What technical uncertainty existed?"
                multiline
                rows={3}
                value={
                  formData.eliminationUncertainty?.question1 || ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eliminationUncertainty: {
                      ...formData.eliminationUncertainty,
                      question1: e.target.value,
                    },
                  })
                }
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                3. Process of Experimentation
              </Typography>
              <TextField
                fullWidth
                label="What alternatives were evaluated and tested?"
                multiline
                rows={3}
                value={
                  formData.processExperimentation?.question1 || ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processExperimentation: {
                      ...formData.processExperimentation,
                      question1: e.target.value,
                    },
                  })
                }
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                4. Technological in Nature
              </Typography>
              <TextField
                fullWidth
                label="What hard sciences were involved?"
                multiline
                rows={3}
                value={
                  formData.technologicalNature?.question1 || ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    technologicalNature: {
                      ...formData.technologicalNature,
                      question1: e.target.value,
                    },
                  })
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          Save Project
        </Button>
      </Box>
    </Box>
  );
}
