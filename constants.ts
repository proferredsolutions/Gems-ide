
import { FileNode } from './types';

export const INITIAL_FILES: FileNode[] = [
  {
    id: '0',
    name: 'src',
    type: 'folder',
    children: [
      { id: '1', name: 'App.jsx', type: 'file' },
      { id: '2', name: 'index.css', type: 'file' },
      { id: '7', name: 'script.py', type: 'file' },
      { id: '8', name: 'index.html', type: 'file' },
      {
        id: '3',
        name: 'components',
        type: 'folder',
        children: [
           { id: '6', name: 'utils.js', type: 'file' },
        ],
      },
    ],
  },
  { id: '4', name: 'package.json', type: 'file' },
  { id: '5', name: 'README.md', type: 'file' },
];
