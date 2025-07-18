import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useStores } from '../../store';
import { useTranslation } from 'react-i18next';

const SupplierPage: React.FC = observer(() => {
  const { t } = useTranslation();
  const { supplierStore, uiStore } = useStores();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        await supplierStore.fetchSuppliers();
      } catch (error) {
        console.error('Ошибка при загрузке поставщиков:', error);
        uiStore.showError(t('errors.loadingFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [supplierStore, uiStore, t]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('suppliers.name'), width: 200 },
    { field: 'contact_person', headerName: t('suppliers.contactPerson'), width: 150 },
    { field: 'email', headerName: t('suppliers.email'), width: 200 },
    { field: 'phone', headerName: t('suppliers.phone'), width: 150 },
    { field: 'address', headerName: t('suppliers.address'), width: 300 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('suppliers.title')}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">{t('suppliers.list')}</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {}}
            >
              {t('suppliers.add')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
        <DataGrid
          rows={supplierStore.suppliers}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
        />
      </Paper>
    </Box>
  );
});

export default SupplierPage; 