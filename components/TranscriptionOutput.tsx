import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Copy, Download, Check, RefreshCw, FileText, File, Edit2, Save, X } from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
// @ts-ignore
import FileSaver from 'file-saver';

interface TranscriptionOutputProps {
  text: string;
  fileName?: string;
  onReset: () => void;
  onSaveEdit?: (newText: string) => void;
}

export const TranscriptionOutput: React.FC<TranscriptionOutputProps> = ({ text, fileName, onReset, onSaveEdit }) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(text);

  // Sync state if prop changes (e.g. loading a different history item)
  useEffect(() => {
    setEditableText(text);
    setIsEditing(false);
  }, [text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleSaveEdit = () => {
    if (onSaveEdit) {
      onSaveEdit(editableText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableText(text);
    setIsEditing(false);
  };

  const getDownloadName = (ext: string) => {
    const base = fileName ? fileName.replace(/\.[^/.]+$/, "") : "transcricao";
    const date = new Date().toISOString().slice(0,10);
    return `${base}_${date}.${ext}`;
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([editableText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = getDownloadName('txt');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      
      const lineHeight = 7;
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - (margin * 2);
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Transcrição - VerbaFlow", margin, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Arquivo: ${fileName || 'Desconhecido'}`, margin, 28);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, margin, 33);
      
      doc.setTextColor(0);
      doc.setFontSize(11);
      
      const splitText = doc.splitTextToSize(editableText, contentWidth);
      
      let cursorY = 45;
      
      for (let i = 0; i < splitText.length; i++) {
        if (cursorY > 280) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(splitText[i], margin, cursorY);
        cursorY += lineHeight;
      }
      
      doc.save(getDownloadName('pdf'));
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsGenerating(true);
    try {
      const textParagraphs = editableText.split('\n').map(line => {
        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, 
            }),
          ],
          spacing: {
            after: 120,
          },
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Transcrição - VerbaFlow",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 400,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Arquivo: ${fileName || 'Desconhecido'}`,
                    italics: true,
                    color: "666666",
                    size: 20,
                  }),
                ],
                spacing: {
                  after: 400,
                },
              }),
              ...textParagraphs,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      FileSaver.saveAs(blob, getDownloadName('docx'));
    } catch (error) {
      console.error("Erro ao gerar Word:", error);
      alert("Erro ao gerar arquivo Word.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {isEditing ? 'Editando Transcrição' : 'Transcrição Concluída'}
            </h2>
            {fileName && <span className="text-xs text-slate-500 ml-4">{fileName}</span>}
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            {!isEditing ? (
              <>
                 <Button 
                  variant="secondary" 
                  onClick={() => setIsEditing(true)} 
                  icon={<Edit2 size={16} />}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  Editar
                </Button>
                
                <div className="h-8 w-[1px] bg-slate-300 mx-1 hidden md:block"></div>

                <Button 
                  variant="secondary" 
                  onClick={handleCopy} 
                  icon={copied ? <Check size={16} /> : <Copy size={16} />}
                  title="Copiar"
                >
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleDownloadTxt} 
                  title="Baixar TXT"
                  icon={<Download size={16} />}
                >
                  TXT
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleDownloadPdf} 
                  isLoading={isGenerating}
                  title="Baixar PDF"
                  icon={<File size={16} />}
                >
                  PDF
                </Button>

                <Button 
                  variant="secondary" 
                  onClick={handleDownloadWord} 
                  isLoading={isGenerating}
                  title="Baixar Word"
                  icon={<FileText size={16} />}
                >
                  Word
                </Button>

                <div className="h-8 w-[1px] bg-slate-300 mx-1 hidden md:block"></div>

                <Button variant="primary" onClick={onReset} icon={<RefreshCw size={16} />}>
                  Nova
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  onClick={handleCancelEdit}
                  icon={<X size={16} />}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveEdit} 
                  icon={<Save size={16} />}
                >
                  Salvar Alterações
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="p-6 max-h-[600px] overflow-y-auto bg-white relative">
          {isEditing ? (
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full h-[500px] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm leading-relaxed text-slate-700 resize-none outline-none"
              spellCheck={false}
            />
          ) : (
            <div className="prose prose-slate max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
              {text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};