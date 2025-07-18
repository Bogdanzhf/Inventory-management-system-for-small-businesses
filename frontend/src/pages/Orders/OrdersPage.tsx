import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useStores } from '../../store';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  order_number: string;
  order_type: 'incoming' | 'outgoing';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  total_amount: number;
  supplier_customer: string;
  contact_info: string;
  notes: string;
  items: OrderItem[];
}

interface OrderFormData {
  order_type: 'incoming' | 'outgoing';
  supplier_customer: string;
  contact_info: string;
  notes: string;
  items: OrderItem[];
}

const initialFormData: OrderFormData = {
  order_type: 'outgoing',
  supplier_customer: '',
  contact_info: '',
  notes: '',
  items: [],
};

const OrdersPage: React.FC = observer(() => {
  const { t } = useTranslation();
  const { uiStore } = useStores();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [productQuantity, setProductQuantity] = useState(1);
  
  // Загрузка данных заказов
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        uiStore.showSnackbar('Ошибка при загрузке данных заказов', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [uiStore]);
  
  // Загрузка доступных продуктов
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/inventory');
        setAvailableProducts(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Обработчики формы
  const handleOpenDialog = (mode: 'add' | 'edit', order?: Order) => {
    setDialogMode(mode);
    if (mode === 'edit' && order) {
      setFormData({
        order_type: order.order_type,
        supplier_customer: order.supplier_customer,
        contact_info: order.contact_info,
        notes: order.notes,
        items: [...order.items],
      });
      setCurrentOrderId(order.id);
    } else {
      setFormData(initialFormData);
      setCurrentOrderId(null);
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

  // Обработчик для выпадающих списков
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Обработчик для выбора продукта
  const handleProductSelect = (e: SelectChangeEvent) => {
    const value = e.target.value;
    // Если значение пустое, установим пустую строку, иначе преобразуем к числу
    setSelectedProduct(value === '' ? '' : Number(value));
  };

  // Обработчик для изменения количества
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductQuantity(parseInt(e.target.value) || 1);
  };
  
  const handleSubmit = async () => {
    try {
      if (formData.items.length === 0) {
        uiStore.showSnackbar('Добавьте хотя бы один товар в заказ', 'warning');
        return;
      }
      
      if (dialogMode === 'add') {
        const response = await api.post('/orders', formData);
        setOrders([...orders, response.data]);
        uiStore.showSnackbar('Заказ успешно создан', 'success');
      } else {
        const response = await api.put(`/orders/${currentOrderId}`, formData);
        setOrders(orders.map(order => order.id === currentOrderId ? response.data : order));
        uiStore.showSnackbar('Заказ успешно обновлен', 'success');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка при сохранении заказа:', error);
      uiStore.showSnackbar('Ошибка при сохранении заказа', 'error');
    }
  };
  
  const handleDelete = async () => {
    if (!currentOrderId) return;
    
    try {
      await api.delete(`/orders/${currentOrderId}`);
      setOrders(orders.filter(order => order.id !== currentOrderId));
      uiStore.showSnackbar('Заказ успешно удален', 'success');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при удалении заказа:', error);
      uiStore.showSnackbar('Ошибка при удалении заказа', 'error');
    }
  };
  
  const handleOpenDeleteDialog = (id: number) => {
    setCurrentOrderId(id);
    setDeleteDialogOpen(true);
  };
  
  const handleViewDetails = (order: Order) => {
    setCurrentOrder(order);
    setDetailsDialog(true);
  };
  
  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const product = availableProducts.find(p => p.id === selectedProduct);
    if (!product) return;
    
    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: productQuantity,
      unit_price: product.unit_price,
    };
    
    // Проверка, есть ли уже такой товар в списке
    const existingItemIndex = formData.items.findIndex(item => item.product_id === newItem.product_id);
    
    if (existingItemIndex >= 0) {
      // Обновляем количество существующего товара
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += newItem.quantity;
      
      setFormData({
        ...formData,
        items: updatedItems,
      });
    } else {
      // Добавляем новый товар
      setFormData({
        ...formData,
        items: [...formData.items, newItem],
      });
    }
    
    // Сбрасываем поля выбора товара
    setSelectedProduct('');
    setProductQuantity(1);
  };
  
  const handleRemoveItem = (productId: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.product_id !== productId),
    });
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Фильтрация данных
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.supplier_customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    if (tabValue === 1) {
      matchesTab = order.order_type === 'incoming';
    } else if (tabValue === 2) {
      matchesTab = order.order_type === 'outgoing';
    }
    
    return matchesSearch && matchesTab;
  });
  
  // Определение колонок для таблицы
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'order_number', headerName: t('orders.orderNumber'), width: 150 },
    { 
      field: 'order_type', 
      headerName: t('orders.type'), 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'incoming' ? t('orders.incoming') : t('orders.outgoing')}
          color={params.value === 'incoming' ? 'primary' : 'secondary'}
          size="small"
        />
      )
    },
    { 
      field: 'status', 
      headerName: t('orders.status'), 
      width: 130,
      renderCell: (params) => {
        let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
        
        switch (params.value) {
          case 'pending':
            color = 'warning';
            break;
          case 'processing':
            color = 'info';
            break;
          case 'completed':
            color = 'success';
            break;
          case 'cancelled':
            color = 'error';
            break;
        }
        
        return (
          <Chip 
            label={t(`orders.statuses.${params.value}`)}
            color={color}
            size="small"
          />
        );
      }
    },
    { field: 'supplier_customer', headerName: t('orders.supplierCustomer'), width: 200 },
    { 
      field: 'total_amount', 
      headerName: t('orders.totalAmount'), 
      width: 130,
      renderCell: (params) => `₽${params.value.toFixed(2)}`
    },
    { 
      field: 'created_at', 
      headerName: t('orders.createdAt'), 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString('ru-RU');
      }
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Order>) => (
        <Box>
          <Tooltip title={t('common.view')}>
            <IconButton 
              size="small" 
              onClick={() => handleViewDetails(params.row)}
              color="info"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenDialog('edit', params.row)}
              color="primary"
              disabled={params.row.status === 'completed' || params.row.status === 'cancelled'}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenDeleteDialog(params.row.id)}
              color="error"
              disabled={params.row.status === 'completed'}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('orders.title')}
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
          <Grid item xs={12} sm={4}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="order tabs">
              <Tab label={t('orders.all')} />
              <Tab label={t('orders.incoming')} />
              <Tab label={t('orders.outgoing')} />
            </Tabs>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('add')}
            >
              {t('orders.createOrder')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>
      
      {/* Диалог создания/редактирования заказа */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? t('orders.createOrder') : t('orders.editOrder')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('orders.type')}</InputLabel>
                <Select
                  name="order_type"
                  value={formData.order_type}
                  onChange={handleSelectChange}
                  label={t('orders.type')}
                >
                  <MenuItem value="incoming">{t('orders.incoming')}</MenuItem>
                  <MenuItem value="outgoing">{t('orders.outgoing')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="supplier_customer"
                label={formData.order_type === 'incoming' ? t('orders.supplier') : t('orders.customer')}
                fullWidth
                value={formData.supplier_customer}
                onChange={handleTextChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="contact_info"
                label={t('orders.contactInfo')}
                fullWidth
                value={formData.contact_info}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                {t('orders.items')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('inventory.name')}</InputLabel>
                      <Select
                        value={selectedProduct === '' ? '' : String(selectedProduct)}
                        onChange={handleProductSelect}
                        label={t('inventory.name')}
                      >
                        {availableProducts.map((product) => (
                          <MenuItem key={product.id} value={String(product.id)}>
                            {product.name} - {product.sku} (₽{product.unit_price.toFixed(2)})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      type="number"
                      label={t('inventory.quantity')}
                      fullWidth
                      value={productQuantity}
                      onChange={handleQuantityChange}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddItem}
                      disabled={!selectedProduct}
                      fullWidth
                    >
                      {t('orders.addItem')}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
              
              {formData.items.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('orders.selectedItems')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 0 }}>
                    <DataGrid
                      rows={formData.items.map((item, index) => ({
                        id: index,
                        ...item,
                        total: item.quantity * item.unit_price,
                      }))}
                      columns={[
                        { field: 'product_name', headerName: t('inventory.name'), width: 200 },
                        { field: 'quantity', headerName: t('inventory.quantity'), width: 120 },
                        { 
                          field: 'unit_price', 
                          headerName: t('inventory.unitPrice'), 
                          width: 150,
                          renderCell: (params) => `₽${params.value.toFixed(2)}`
                        },
                        { 
                          field: 'total', 
                          headerName: t('orders.total'), 
                          width: 150,
                          renderCell: (params) => `₽${params.value.toFixed(2)}`
                        },
                        {
                          field: 'actions',
                          headerName: t('common.actions'),
                          width: 100,
                          renderCell: (params) => (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(params.row.product_id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )
                        }
                      ]}
                      autoHeight
                      hideFooter
                      disableRowSelectionOnClick
                    />
                  </Paper>
                  <Typography variant="h6" align="right" sx={{ mt: 2 }}>
                    {t('orders.totalAmount')}: ₽
                    {formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2)}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
                  {t('orders.noItemsSelected')}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label={t('orders.notes')}
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
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
            disabled={!formData.supplier_customer || formData.items.length === 0}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог просмотра деталей заказа */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('orders.orderDetails')} #{currentOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {currentOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t('orders.type')}:</Typography>
                <Typography variant="body1">
                  {currentOrder.order_type === 'incoming' ? t('orders.incoming') : t('orders.outgoing')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t('orders.status')}:</Typography>
                <Chip 
                  label={t(`orders.statuses.${currentOrder.status}`)}
                  color={
                    currentOrder.status === 'pending' ? 'warning' :
                    currentOrder.status === 'processing' ? 'info' :
                    currentOrder.status === 'completed' ? 'success' : 'error'
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">
                  {currentOrder.order_type === 'incoming' ? t('orders.supplier') : t('orders.customer')}:
                </Typography>
                <Typography variant="body1">{currentOrder.supplier_customer}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t('orders.contactInfo')}:</Typography>
                <Typography variant="body1">{currentOrder.contact_info || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t('orders.createdAt')}:</Typography>
                <Typography variant="body1">
                  {new Date(currentOrder.created_at).toLocaleString('ru-RU')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">{t('orders.updatedAt')}:</Typography>
                <Typography variant="body1">
                  {new Date(currentOrder.updated_at).toLocaleString('ru-RU')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">{t('orders.notes')}:</Typography>
                <Typography variant="body1">{currentOrder.notes || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>{t('orders.items')}:</Typography>
                <Paper variant="outlined" sx={{ p: 0 }}>
                  <DataGrid
                    rows={currentOrder.items.map((item, index) => ({
                      id: index,
                      ...item,
                      total: item.quantity * item.unit_price,
                    }))}
                    columns={[
                      { field: 'product_name', headerName: t('inventory.name'), width: 200 },
                      { field: 'quantity', headerName: t('inventory.quantity'), width: 120 },
                      { 
                        field: 'unit_price', 
                        headerName: t('inventory.unitPrice'), 
                        width: 150,
                        renderCell: (params) => `₽${params.value.toFixed(2)}`
                      },
                      { 
                        field: 'total', 
                        headerName: t('orders.total'), 
                        width: 150,
                        renderCell: (params) => `₽${params.value.toFixed(2)}`
                      }
                    ]}
                    autoHeight
                    hideFooter
                    disableRowSelectionOnClick
                  />
                </Paper>
                <Typography variant="h6" align="right" sx={{ mt: 2 }}>
                  {t('orders.totalAmount')}: ₽{currentOrder.total_amount.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог удаления заказа */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('orders.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('orders.deleteConfirmMessage')}
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
    </Box>
  );
});

export default OrdersPage; 