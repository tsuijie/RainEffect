import React from 'react';
import '@/App.css';
import { Route, BrowserRouter, Switch } from 'react-router-dom'
import RainView from '@/views/rain/index';

function App() {
  return (
    <BrowserRouter basename='RainEffect'>
      <Switch>
        <Route exact path='/'><RainView /></Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
