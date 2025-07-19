import React from 'react';
import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { CssBaseline } from '@mui/material';
import classNames from 'classnames';

import { useStores } from '../../store';
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import CustomSnackbar from '../UI/CustomSnackbar';
import styles from './Layout.module.scss';

const Layout: React.FC = () => {
  const { uiStore } = useStores();
  const { sidebarOpen } = uiStore;

  return (
    <div className={styles.layout}>
      <CssBaseline />
      <AppBar />
      <Sidebar />
      <div className={styles.content}>
        <div
          className={classNames(styles.mainContent, {
            [styles.mainContentWithSidebar]: sidebarOpen,
          })}
        >
          <Outlet />
        </div>
      </div>
      <CustomSnackbar />
    </div>
  );
};

export default observer(Layout);
