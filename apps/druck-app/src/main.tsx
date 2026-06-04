import { render } from 'preact';
import { App } from './App.js';
import '@druck/css';
import './styles.css';

render(<App />, document.getElementById('app')!);