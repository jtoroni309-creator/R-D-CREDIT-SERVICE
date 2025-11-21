import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import { PictureAsPdf, TableChart } from '@mui/icons-material';
import { reportService } from '../services/api';
import { useState } from 'react';

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (type: string) => {
    setLoading(type);
    try {
      let response;
      let filename;

      switch (type) {
        case 'pdf':
          response = await reportService.generatePDF(id!);
          filename = 'RD_Study.pdf';
          break;
        case 'form6765-json':
          response = await reportService.exportForm6765JSON(id!);
          filename = 'Form6765.json';
          break;
        case 'form6765-csv':
          response = await reportService.exportForm6765CSV(id!);
          filename = 'Form6765.csv';
          break;
        case 'form6765-excel':
          response = await reportService.exportForm6765Excel(id!);
          filename = 'Form6765.xlsx';
          break;
        default:
          return;
      }

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Generate Reports
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        All reports will be automatically saved to the engagement's ShareFile folder.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PictureAsPdf sx={{ fontSize: 40, mr: 2, color: '#d32f2f' }} />
                <Typography variant="h5">R&D Study PDF</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Complete R&D tax credit study report including:
              </Typography>
              <ul style={{ marginTop: 0 }}>
                <li>Executive summary</li>
                <li>Project narratives and 4-part test results</li>
                <li>QRE summaries and detailed breakdowns</li>
                <li>Federal and state credit calculations</li>
              </ul>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleDownload('pdf')}
                disabled={loading === 'pdf'}
              >
                {loading === 'pdf' ? 'Generating...' : 'Generate PDF Report'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TableChart sx={{ fontSize: 40, mr: 2, color: '#1976d2' }} />
                <Typography variant="h5">Form 6765 Exports</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                IRS Form 6765 data in multiple formats:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => handleDownload('form6765-json')}
                  disabled={loading === 'form6765-json'}
                >
                  {loading === 'form6765-json' ? 'Generating...' : 'JSON Format'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleDownload('form6765-csv')}
                  disabled={loading === 'form6765-csv'}
                >
                  {loading === 'form6765-csv' ? 'Generating...' : 'CSV Format'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleDownload('form6765-excel')}
                  disabled={loading === 'form6765-excel'}
                >
                  {loading === 'form6765-excel'
                    ? 'Generating...'
                    : 'Excel Workbook'}
                </Button>
              </Box>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Use these exports to populate Form 6765 in your tax software.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="warning" sx={{ mt: 3 }}>
        ⚠️ Important: All AI-generated content in these reports must be reviewed
        and approved by a qualified CPA before submission to the IRS.
      </Alert>
    </Box>
  );
}
