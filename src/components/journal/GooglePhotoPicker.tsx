import { useState, useRef } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GooglePhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function GooglePhotoPicker({ isOpen, onClose, selectedIds, onSelect }: GooglePhotoPickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pixel-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('journal-photos')
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from('journal-photos')
        .getPublicUrl(fileName);

      onSelect([...selectedIds, publicUrlData.publicUrl]);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-sm w-full text-left border-4 border-black shadow-brutal flex flex-col relative">
        <button onClick={onClose} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 border-2 border-black shadow-brutal-sm z-10">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black uppercase mb-6 flex items-center justify-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-500" /> Ajouter un PIK
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-brutal w-full py-8 text-lg font-black bg-blue-100 text-blue-600 border-2 border-black border-dashed hover:bg-blue-200 flex flex-col items-center justify-center gap-3"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8" />
                SÉLECTIONNER UNE IMAGE
              </>
            )}
          </button>

          {error && <p className="text-red-600 font-bold text-sm text-center bg-red-50 p-2 border-2 border-red-200">{error}</p>}
        </div>
      </div>
    </div>
  );
}