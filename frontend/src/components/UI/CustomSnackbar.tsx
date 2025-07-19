import React from 'react';
import { observer } from 'mobx-react-lite';
import { Snackbar, Alert, AlertColor } from '@mui/material';

import { useStores } from '../../store';

const CustomSnackbar: React.FC = () => {
  const { uiStore } = useStores();
  const { snackbar, closeSnackbar } = uiStore;

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    closeSnackbar();
  };

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={snackbar.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity={snackbar.severity as AlertColor}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default observer(CustomSnackbar);
