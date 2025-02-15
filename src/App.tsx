
import { Box, CssBaseline } from '@mui/material';
import React from 'react';
import {Reacteroids} from './asteroids/Reacteroids';
import './asteroids/style.css';

const App: React.FC = () => {
  return (
    <>
    <CssBaseline/>
    <Box sx={{ height: 750, width: 1200 }}>
      <Reacteroids />
    </Box>
    </>
  );
};

export default App;
