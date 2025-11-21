import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useState } from 'react';
import { qreService } from '../services/api';

export default function QREPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: wagesData } = useQuery({
    queryKey: ['wages', id],
    queryFn: () => qreService.listWages(id!),
  });

  const { data: suppliesData } = useQuery({
    queryKey: ['supplies', id],
    queryFn: () => qreService.listSupplies(id!),
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts', id],
    queryFn: () => qreService.listContracts(id!),
  });

  const createWageMutation = useMutation({
    mutationFn: (data: any) => qreService.createWage(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages', id] });
      handleCloseDialog();
    },
  });

  const createSupplyMutation = useMutation({
    mutationFn: (data: any) => qreService.createSupply(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies', id] });
      handleCloseDialog();
    },
  });

  const createContractMutation = useMutation({
    mutationFn: (data: any) => qreService.createContract(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', id] });
      handleCloseDialog();
    },
  });

  const deleteWageMutation = useMutation({
    mutationFn: (wageId: string) => qreService.deleteWage(wageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wages', id] });
    },
  });

  const deleteSupplyMutation = useMutation({
    mutationFn: (supplyId: string) => qreService.deleteSupply(supplyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies', id] });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: (contractId: string) => qreService.deleteContract(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', id] });
    },
  });

  const wages = wagesData?.data || [];
  const supplies = suppliesData?.data || [];
  const contracts = contractsData?.data || [];

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = () => {
    if (currentTab === 0) {
      createWageMutation.mutate(formData);
    } else if (currentTab === 1) {
      createSupplyMutation.mutate(formData);
    } else if (currentTab === 2) {
      createContractMutation.mutate(formData);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Qualified Research Expenses
      </Typography>

      <Card>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Wages" />
          <Tab label="Supplies" />
          <Tab label="Contract Research" />
        </Tabs>

        <CardContent>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{ mb: 2 }}
          >
            Add {currentTab === 0 ? 'Wage' : currentTab === 1 ? 'Supply' : 'Contract'}
          </Button>

          {currentTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee Name</TableCell>
                    <TableCell align="right">Annual Salary</TableCell>
                    <TableCell align="right">% Time</TableCell>
                    <TableCell align="right">Qualified Wages</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wages.map((wage: any) => (
                    <TableRow key={wage.id}>
                      <TableCell>{wage.employeeName}</TableCell>
                      <TableCell align="right">
                        ${Number(wage.annualSalary).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {Number(wage.percentTime)}%
                      </TableCell>
                      <TableCell align="right">
                        ${Number(wage.qualifiedWages).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteWageMutation.mutate(wage.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {wages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No wages entered yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {currentTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell align="right">Qualified Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplies.map((supply: any) => (
                    <TableRow key={supply.id}>
                      <TableCell>{supply.description}</TableCell>
                      <TableCell align="right">
                        ${Number(supply.totalCost).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${Number(supply.qualifiedAmount).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteSupplyMutation.mutate(supply.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {supplies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No supplies entered yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {currentTab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell align="right">Contract Amount</TableCell>
                    <TableCell align="right">Qualified %</TableCell>
                    <TableCell align="right">Qualified Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.vendorName}</TableCell>
                      <TableCell align="right">
                        ${Number(contract.contractAmount).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {Number(contract.qualifiedPercent)}%
                      </TableCell>
                      <TableCell align="right">
                        ${Number(contract.qualifiedAmount).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            deleteContractMutation.mutate(contract.id)
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {contracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No contracts entered yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add {currentTab === 0 ? 'Wage' : currentTab === 1 ? 'Supply' : 'Contract'}
        </DialogTitle>
        <DialogContent>
          {currentTab === 0 && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Employee Name"
                value={formData.employeeName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, employeeName: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Annual Salary"
                value={formData.annualSalary || ''}
                onChange={(e) =>
                  setFormData({ ...formData, annualSalary: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="% Time on R&D"
                value={formData.percentTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, percentTime: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Qualified Wages"
                value={formData.qualifiedWages || ''}
                onChange={(e) =>
                  setFormData({ ...formData, qualifiedWages: e.target.value })
                }
              />
            </Box>
          )}

          {currentTab === 1 && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Total Cost"
                value={formData.totalCost || ''}
                onChange={(e) =>
                  setFormData({ ...formData, totalCost: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Qualified Amount"
                value={formData.qualifiedAmount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, qualifiedAmount: e.target.value })
                }
              />
            </Box>
          )}

          {currentTab === 2 && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Vendor Name"
                value={formData.vendorName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, vendorName: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Contract Amount"
                value={formData.contractAmount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contractAmount: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Qualified %"
                value={formData.qualifiedPercent || ''}
                onChange={(e) => {
                  const percent = parseFloat(e.target.value) || 0;
                  const amount = (parseFloat(formData.contractAmount) || 0) * (percent / 100);
                  setFormData({
                    ...formData,
                    qualifiedPercent: e.target.value,
                    qualifiedAmount: amount.toFixed(2),
                  });
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Qualified Amount"
                value={formData.qualifiedAmount || ''}
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
