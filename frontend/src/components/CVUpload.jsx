import React, { useState } from 'react';
import { Upload, Camera, Sparkles, CheckCircle, RefreshCw, Award, Info, AlertTriangle } from 'lucide-react';
import { gradeProduceImage } from '../utils/cvGrading';

// Sample curated produce presets for instant zero-friction testing
const PRESET_PRODUCE = [
  {
    name: 'Fresh Tomatoes',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    crop: 'Tomato'
  },
  {
    name: 'Seed Potatoes',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    crop: 'Potato'
  },
  {
    name: 'Fresh Onions',
    url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    crop: 'Onion'
  }
];

export default function CVUpload({ onGradeAssigned, initialImage }) {
  const [imagePreview, setImagePreview] = useState(initialImage || '');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(null);

  const processImageForGrading = async (imgData) => {
    setImagePreview(imgData);
    setGrading(true);
    setResult(null);

    try {
      const gradingResult = await gradeProduceImage(imgData);
      setResult(gradingResult);
      if (onGradeAssigned) {
        onGradeAssigned(gradingResult.grade, imgData, gradingResult);
      }
    } catch (err) {
      console.error('Grading error', err);
    } finally {
      setGrading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processImageForGrading(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (presetUrl) => {
    processImageForGrading(presetUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Produce Photo & AI Computer Vision Grading
        </label>
        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          Automated Quality Verification
        </span>
      </div>

      {/* Upload Zone / Preview */}
      <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 transition-colors bg-slate-50/60 overflow-hidden">
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden bg-black/5 aspect-video max-h-56 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Produce Preview"
              className="w-full h-full object-cover"
            />

            {/* Simulated Scanning Laser Line while grading */}
            {grading && (
              <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[1px] flex flex-col items-center justify-center">
                <div className="cv-scanner"></div>
                <div className="bg-black/75 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Analyzing Blemish, Ripeness & Sizing...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Upload produce photo for automated grading
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              PNG, JPG up to 10MB &bull; AI assesses blemish, color, and size
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              Browse Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {imagePreview && !grading && (
          <div className="mt-3 flex justify-end">
            <label className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Quick Test Presets */}
      <div>
        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
          Or test with sample verified produce:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PRODUCE.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset.url)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium transition-colors"
            >
              📷 {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grading Result Card */}
      {result && (
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${result.badgeColor}`}>
                Grade {result.grade}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {result.overallScore}% Quality Index
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Inspected at {result.inspectedAt}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {result.description}
          </p>

          {/* Detailed metrics breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Blemish Purity</span>
              <span className="font-bold text-slate-800">{result.blemishScore}%</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Color Ripeness</span>
              <span className="font-bold text-slate-800">{result.colorScore}%</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Size Standard</span>
              <span className="font-bold text-slate-800">{result.sizeScore}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
