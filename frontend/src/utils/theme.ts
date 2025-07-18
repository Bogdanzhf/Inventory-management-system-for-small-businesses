import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Создаем функцию для создания темы
export const createAppTheme = (mode: PaletteMode): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#1976d2',
          },
        },
      },
    },
  });
};

// Создаем светлую и темную темы
export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark'); 