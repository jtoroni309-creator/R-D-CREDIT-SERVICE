import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { engagementService } from '../services/api';

export default function EngagementListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    taxpayerName: '',
    taxpayerEIN: '',
    taxpayerAddress: '',
    taxYear: new Date().getFullYear(),
    selectedStates: [] as string[],
  });

  const { data: engagementsData, isLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => engagementService.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => engagementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      setCreateDialogOpen(false);
      resetForm();
    },
  });

  const engagements = engagementsData?.data?.engagements || [];

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      taxpayerName: '',
      taxpayerEIN: '',
      taxpayerAddress: '',
      taxYear: new Date().getFullYear(),
      selectedStates: [],
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      DRAFT: 'default',
      IN_PROGRESS: 'primary',
      REVIEW: 'warning',
      APPROVED: 'success',
      COMPLETED: 'success',
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Engagements</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Engagement
        </Button>
      </Box>

      <Grid container spacing={3}>
        {engagements.map((engagement: any) => (
          <Grid item xs={12} md={6} lg={4} key={engagement.id}>
            <Card
              sx={{ cursor: 'pointer', height: '100%' }}
              onClick={() => navigate(`/engagements/${engagement.id}`)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="div">
                    {engagement.taxpayerName}
                  </Typography>
                  <Chip
                    label={engagement.status}
                    color={getStatusColor(engagement.status)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  EIN: {engagement.taxpayerEIN}
                </Typography>
                <Typography variant="body2">
                  Tax Year: {engagement.taxYear}
                </Typography>
                <Typography variant="body2">
                  Projects: {engagement.projects?.length || 0}
                </Typography>
                {engagement.calculations?.[0] && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    QRE: $
                    {Number(engagement.calculations[0].totalQRE).toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Engagement</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Taxpayer Name"
              value={formData.taxpayerName}
              onChange={(e) =>
                setFormData({ ...formData, taxpayerName: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="EIN"
              value={formData.taxpayerEIN}
              onChange={(e) =>
                setFormData({ ...formData, taxpayerEIN: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.taxpayerAddress}
              onChange={(e) =>
                setFormData({ ...formData, taxpayerAddress: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Tax Year"
              value={formData.taxYear}
              onChange={(e) =>
                setFormData({ ...formData, taxYear: parseInt(e.target.value) })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Selected States (comma-separated)"
              placeholder="CA, NY, TX"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  selectedStates: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s),
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={createMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
