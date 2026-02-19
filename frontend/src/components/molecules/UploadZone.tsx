import React from 'react';
import { Upload, FileCheck } from 'lucide-react';

interface UploadZoneProps {
    fileName?: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ fileName, onFileChange }) => {
    return (
        <label className="relative group block w-full aspect-[2/1] md:aspect-[3/1] border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer overflow-hidden">
            <input type="file" className="hidden" onChange={onFileChange} accept=".xlsx,.xls" />
            <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/10 transition-all">
                    {fileName ? <FileCheck className="text-emerald-500" size={32} /> : <Upload className="text-slate-400" size={32} />}
                </div>
                <div className="text-center">
                    <p className="font-bold text-slate-700">{fileName || "Drop your Excel here or click to browse"}</p>
                    <p className="text-sm text-slate-400 mt-1">Supports XLSX, XLS (Max 50MB)</p>
                </div>
            </div>
        </label>
    );
};

export default UploadZone;
