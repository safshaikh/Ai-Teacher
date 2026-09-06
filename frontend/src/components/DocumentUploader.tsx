'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../lib/api';

interface DocumentUploaderProps {
  onDocumentUploaded: (docId: string, filename: string) => void;
}

export default function DocumentUploader({ onDocumentUploaded }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<{ id: string; name: string; chunks: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await uploadDocument(file);
      setUploadedDoc({
        id: res.document_id,
        name: res.filename,
        chunks: res.chunks_count
      });
      onDocumentUploaded(res.document_id, res.filename);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and index document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {!uploadedDoc ? (
        <label className="flex flex-col items-center justify-center w-full h-36 px-4 transition bg-slate-900/60 border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl cursor-pointer group hover:bg-slate-900/90">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
            )}
            <p className="text-sm font-medium text-slate-200">
              {isUploading ? 'Extracting & Indexing RAG Chunks...' : 'Click to Upload Textbook (PDF, DOCX, PPTX)'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              RAG grounding will source explanation citations directly from this document
            </p>
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{uploadedDoc.name}</p>
              <p className="text-xs text-emerald-400 font-mono">
                Document Indexed • {uploadedDoc.chunks} RAG Chunks Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadedDoc(null)}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Change File
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
