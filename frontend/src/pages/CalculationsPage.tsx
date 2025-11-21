import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { Calculate, Refresh } from '@mui/icons-material';
import { calculationService } from '../services/api';

export default function CalculationsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: calculationData, isLoading } = useQuery({
    queryKey: ['calculation', id],
    queryFn: () => calculationService.getLatest(id!),
  });

  const calculateMutation = useMutation({
    mutationFn: () => calculationService.calculate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculation', id] });
      alert('Calculation completed successfully!');
    },
  });

  const calculation = calculationData?.data;

  const handleCalculate = () => {
    if (
      window.confirm(
        'This will recalculate all credits. Previous calculations will be archived. Continue?'
      )
    ) {
      calculateMutation.mutate();
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Credit Calculations</Typography>
        <Button
          variant="contained"
          startIcon={calculation ? <Refresh /> : <Calculate />}
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
        >
          {calculation ? 'Recalculate' : 'Calculate Credits'}
        </Button>
      </Box>

      {!calculation && (
        <Alert severity="info">
          No calculations have been run yet. Click "Calculate Credits" to begin.
        </Alert>
      )}

      {calculation && (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Qualified Research Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Wages</TableCell>
                          <TableCell align="right">
                            ${Number(calculation.totalWages).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Supplies</TableCell>
                          <TableCell align="right">
                            ${Number(calculation.totalSupplies).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Contract Research</TableCell>
                          <TableCell align="right">
                            ${Number(calculation.totalContracts).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <strong>Total QRE</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              ${Number(calculation.totalQRE).toLocaleString()}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Federal Regular Credit
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Current Year QRE</TableCell>
                          <TableCell align="right">
                            ${Number(calculation.totalQRE).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Base Amount</TableCell>
                          <TableCell align="right">
                            $
                            {Number(
                              calculation.regularBaseAmount || 0
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Excess QRE</TableCell>
                          <TableCell align="right">
                            $
                            {Number(
                              calculation.regularExcessQRE || 0
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Credit Rate</TableCell>
                          <TableCell align="right">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <strong>Regular Credit</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong style={{ color: '#2e7d32', fontSize: '1.2rem' }}>
                              $
                              {Number(
                                calculation.regularCreditAmount || 0
                              ).toLocaleString()}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Federal Alternative Simplified Credit (ASC)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Current Year QRE</TableCell>
                          <TableCell align="right">
                            ${Number(calculation.totalQRE).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Base Amount (50% of avg prior 3 yrs)</TableCell>
                          <TableCell align="right">
                            $
                            {Number(calculation.ascBaseAmount || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Excess QRE</TableCell>
                          <TableCell align="right">
                            $
                            {Number(calculation.ascExcessQRE || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Credit Rate</TableCell>
                          <TableCell align="right">14%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <strong>ASC Credit</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong style={{ color: '#2e7d32', fontSize: '1.2rem' }}>
                              $
                              {Number(
                                calculation.ascCreditAmount || 0
                              ).toLocaleString()}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {calculation.stateCredits &&
              Array.isArray(calculation.stateCredits) &&
              calculation.stateCredits.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        State Credits
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>State</TableCell>
                              <TableCell align="right">Rate</TableCell>
                              <TableCell align="right">Credit</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculation.stateCredits.map((state: any) => (
                              <TableRow key={state.stateCode}>
                                <TableCell>{state.stateName}</TableCell>
                                <TableCell align="right">
                                  {(state.creditRate * 100).toFixed(2)}%
                                </TableCell>
                                <TableCell align="right">
                                  ${state.creditAmount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            Calculation completed on{' '}
            {new Date(calculation.calculatedAt).toLocaleString()}
          </Alert>
        </>
      )}
    </Box>
  );
}
