import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  IconButton, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useStores } from '../../store';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import api from '../../services/api';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit_price: number;
  min_threshold: number;
  supplier: string;
  location: string;
  last_restock_date: string;
}

interface InventoryFormData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit_price: number;
  min_threshold: number;
  supplier: string;
  location: string;
}

const initialFormData: InventoryFormData = {
  name: '',
  sku: '',
  category: '',
  quantity: 0,
  unit_price: 0,
  min_threshold: 0,
  supplier: '',
  location: '',
};

const InventoryPage: React.FC = observer(() => {
  const { t } = useTranslation();
  const { uiStore } = useStores();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<InventoryFormData>(initialFormData);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Загрузка данных инвентаря
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/inventory');
        setInventory(response.data);
        
        // Извлечение уникальных категорий для фильтра без использования Set
        const categoryMap: {[key: string]: boolean} = {};
        response.data.forEach((item: InventoryItem) => {
          if (item.category) {
            categoryMap[item.category] = true;
          }
        });
        const uniqueCategories = Object.keys(categoryMap);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Ошибка при загрузке инвентаря:', error);
        uiStore.showSnackbar('Ошибка при загрузке данных инвентаря', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, [uiStore]);
  
  // Обработчики формы
  const handleOpenDialog = (mode: 'add' | 'edit', item?: InventoryItem) => {
    setDialogMode(mode);
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.unit_price,
        min_threshold: item.min_threshold,
        supplier: item.supplier,
        location: item.location,
      });
      setCurrentItemId(item.id);
    } else {
      setFormData(initialFormData);
      setCurrentItemId(null);
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Обработчик для текстовых полей
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Обработчик для числовых полей
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: Number(value),
    });
  };

  // Обработчик для категории фильтра
  const handleFilterCategoryChange = (e: SelectChangeEvent) => {
    setFilterCategory(e.target.value);
  };
  
  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        const response = await api.post('/inventory', formData);
        setInventory([...inventory, response.data]);
        uiStore.showSnackbar('Товар успешно добавлен', 'success');
      } else {
        const response = await api.put(`/inventory/${currentItemId}`, formData);
        setInventory(inventory.map(item => item.id === currentItemId ? response.data : item));
        uiStore.showSnackbar('Товар успешно обновлен', 'success');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при сохранении товара:', error);
      uiStore.showSnackbar('Ошибка при сохранении товара', 'error');
    }
  };
  
  const handleDelete = async () => {
    if (!currentItemId) return;
    
    try {
      await api.delete(`/inventory/${currentItemId}`);
      setInventory(inventory.filter(item => item.id !== currentItemId));
      uiStore.showSnackbar('Товар успешно удален', 'success');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при удалении товара:', error);
      uiStore.showSnackbar('Ошибка при удалении товара', 'error');
    }
  };
  
  const handleOpenDeleteDialog = (id: number) => {
    setCurrentItemId(id);
    setDeleteDialogOpen(true);
  };
  
  const handleGenerateQRCode = async (id: number) => {
    try {
      const response = await api.get(`/inventory/${id}/qrcode`);
      setQrCodeUrl(response.data.qrcode_url);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при генерации QR-кода:', error);
      uiStore.showSnackbar('Ошибка при генерации QR-кода', 'error');
    }
  };
  
  // Фильтрация данных
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? item.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });
  
  // Определение колонок для таблицы
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('inventory.name'), width: 200 },
    { field: 'sku', headerName: t('inventory.sku'), width: 120 },
    { field: 'category', headerName: t('inventory.category'), width: 150 },
    { 
      field: 'quantity', 
      headerName: t('inventory.quantity'), 
      width: 120,
      renderCell: (params: GridRenderCellParams<InventoryItem>) => {
        const item = params.row;
        const isLowStock = item.quantity <= item.min_threshold;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLowStock && (
              <Tooltip title={t('inventory.lowStock')}>
                <WarningIcon color="error" fontSize="small" sx={{ mr: 1 }} />
              </Tooltip>
            )}
            {item.quantity}
          </Box>
        );
      }
    },
    { 
      field: 'unit_price', 
      headerName: t('inventory.unitPrice'), 
      width: 130,
      renderCell: (params) => `₽${params.value.toFixed(2)}`
    },
    { field: 'supplier', headerName: t('inventory.supplier'), width: 180 },
    { field: 'location', headerName: t('inventory.location'), width: 150 },
    { 
      field: 'last_restock_date', 
      headerName: t('inventory.lastRestockDate'), 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('ru-RU');
      }
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<InventoryItem>) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenDialog('edit', params.row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenDeleteDialog(params.row.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('inventory.generateQR')}>
            <IconButton 
              size="small" 
              onClick={() => handleGenerateQRCode(params.row.id)}
              color="secondary"
            >
              <QrCodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('inventory.title')}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">
                <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                {t('inventory.filterByCategory')}
              </InputLabel>
              <Select
                labelId="category-filter-label"
                value={filterCategory}
                onChange={handleFilterCategoryChange}
                label={t('inventory.filterByCategory')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('add')}
            >
              {t('inventory.addItem')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
        <DataGrid
          rows={filteredInventory}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          getRowClassName={(params) => {
            return params.row.quantity <= params.row.min_threshold ? 'low-stock-row' : '';
          }}
          sx={{
            '& .low-stock-row': {
              bgcolor: 'rgba(255, 0, 0, 0.1)',
            },
          }}
        />
      </Paper>
      
      {/* Диалог добавления/редактирования товара */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? t('inventory.addItem') : t('inventory.editItem')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label={t('inventory.name')}
                fullWidth
                value={formData.name}
                onChange={handleTextChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="sku"
                label={t('inventory.sku')}
                fullWidth
                value={formData.sku}
                onChange={handleTextChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="category"
                label={t('inventory.category')}
                fullWidth
                value={formData.category}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantity"
                label={t('inventory.quantity')}
                type="number"
                fullWidth
                value={formData.quantity}
                onChange={handleNumberChange}
                InputProps={{ inputProps: { min: 0 } }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="unit_price"
                label={t('inventory.unitPrice')}
                type="number"
                fullWidth
                value={formData.unit_price}
                onChange={handleNumberChange}
                InputProps={{ 
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">₽</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="min_threshold"
                label={t('inventory.minThreshold')}
                type="number"
                fullWidth
                value={formData.min_threshold}
                onChange={handleNumberChange}
                InputProps={{ inputProps: { min: 0 } }}
                helperText={t('inventory.minThresholdHelp')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="supplier"
                label={t('inventory.supplier')}
                fullWidth
                value={formData.supplier}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="location"
                label={t('inventory.location')}
                fullWidth
                value={formData.location}
                onChange={handleTextChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || !formData.sku}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог удаления товара */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('inventory.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('inventory.deleteConfirmMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог QR-кода */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
      >
        <DialogTitle>{t('inventory.qrCodeTitle')}</DialogTitle>
        <DialogContent>
          {qrCodeUrl && (
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            {t('common.close')}
          </Button>
          <Button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrCodeUrl;
              link.download = 'qrcode.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }} 
            color="primary"
          >
            {t('common.download')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default InventoryPage; 