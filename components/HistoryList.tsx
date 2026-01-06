import React from 'react';
import { HistoryItem } from '../types';
import { FileText, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="p-1.5 bg-slate-200 rounded-md">
          <FileText size={20} className="text-slate-600" />
        </span>
        Histórico Recente
      </h3>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => (
          <div 
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-800 truncate pr-2" title={item.fileName}>
                  {item.fileName}
                </h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                  title="Excluir do histórico"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                <Calendar size={12} />
                <span>{new Date(item.date).toLocaleDateString()} às {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              <p className="text-sm text-slate-600 line-clamp-3 mb-4 font-mono bg-slate-50 p-2 rounded border border-slate-100 h-20">
                {item.text}
              </p>
            </div>

            <Button 
              variant="secondary" 
              className="w-full justify-between group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors"
              onClick={() => onSelect(item)}
            >
              Abrir
              <ArrowRight size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};