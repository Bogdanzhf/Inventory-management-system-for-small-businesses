import React from 'react';
import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useStores } from '../../store';
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import CustomSnackbar from '../UI/CustomSnackbar';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const Layout: React.FC = () => {
  const { uiStore } = useStores();
  const { sidebarOpen } = uiStore;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar drawerWidth={drawerWidth} />
      <Sidebar drawerWidth={drawerWidth} />
      <Main open={sidebarOpen}>
        <Toolbar />
        <Box sx={{ py: 2 }}>
          <Outlet />
        </Box>
      </Main>
      <CustomSnackbar />
    </Box>
  );
};

export default observer(Layout); 